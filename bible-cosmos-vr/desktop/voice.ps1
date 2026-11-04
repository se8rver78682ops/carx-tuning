# Voice helper for the Bible desktop app (Windows).
# Reads one JSON request per line from stdin and answers one line on stdout:
#   {"cmd":"voices"}                     -> V[{"id":..,"name":..,"lang":..}, ...]
#   {"t":"text","v":"voice id","r":1.0}  -> F<path to wav file>   or   E<error>
# Uses the voices installed in Windows: modern ones (Windows.Media.SpeechSynthesis, "rt:")
# and classic SAPI voices (System.Speech, "sapi:"). Nothing is downloaded.
param([string]$Dir)
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Text.Encoding]::UTF8
[Console]::OutputEncoding = [Text.Encoding]::UTF8
if (-not $Dir) { $Dir = [IO.Path]::GetTempPath() }

$winrt = $false
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
  $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
      $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
  $rt = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
  $winrt = $true
} catch { $winrt = $false }

function Await($op, [Type]$type) {
  $task = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
  $task.Wait(-1) | Out-Null
  $task.Result
}

$sapi = $null
try { Add-Type -AssemblyName System.Speech; $sapi = New-Object System.Speech.Synthesis.SpeechSynthesizer } catch { $sapi = $null }

function Get-Voices {
  $list = @()
  if ($winrt) {
    foreach ($v in [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices) {
      $list += [pscustomobject]@{ id = 'rt:' + $v.Id; name = $v.DisplayName; lang = $v.Language }
    }
  }
  if ($sapi) {
    foreach ($v in $sapi.GetInstalledVoices()) {
      if ($v.Enabled) { $i = $v.VoiceInfo; $list += [pscustomobject]@{ id = 'sapi:' + $i.Name; name = $i.Name; lang = $i.Culture.Name } }
    }
  }
  return $list
}

$n = 0
while ($null -ne ($line = [Console]::In.ReadLine())) {
  try {
    $q = $line | ConvertFrom-Json
    if ($q.cmd -eq 'voices') {
      $json = ConvertTo-Json -Compress -InputObject @(Get-Voices)
      [Console]::Out.WriteLine('V' + $json); [Console]::Out.Flush()
      continue
    }
    $n++
    $out = Join-Path $Dir ('v' + $n + '.wav')
    $text = [string]$q.t
    $rate = [double]$q.r
    if ($rate -le 0) { $rate = 1.0 }
    if ($winrt -and ([string]$q.v).StartsWith('rt:')) {
      $id = ([string]$q.v).Substring(3)
      $voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.Id -eq $id } | Select-Object -First 1
      if ($voice) { $rt.Voice = $voice }
      try { $rt.Options.SpeakingRate = [Math]::Max(0.5, [Math]::Min(3.0, $rate)) } catch { }
      $stream = Await ($rt.SynthesizeTextToStreamAsync($text)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
      $size = [uint32]$stream.Size
      $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
      $null = Await ($reader.LoadAsync($size)) ([uint32])
      $bytes = New-Object byte[] $size
      $reader.ReadBytes($bytes)
      [IO.File]::WriteAllBytes($out, $bytes)
      $reader.Dispose(); $stream.Dispose()
    } elseif ($sapi) {
      $name = ([string]$q.v) -replace '^sapi:', ''
      if ($name) { try { $sapi.SelectVoice($name) } catch { } }
      $sapi.Rate = [int][Math]::Max(-10, [Math]::Min(10, [Math]::Round(($rate - 1.0) * 10)))
      $sapi.SetOutputToWaveFile($out)
      $sapi.Speak($text)
      $sapi.SetOutputToNull()
    } else {
      throw 'no speech engine'
    }
    [Console]::Out.WriteLine('F' + $out); [Console]::Out.Flush()
  } catch {
    [Console]::Out.WriteLine('E' + ($_.Exception.Message -replace '[\r\n]+', ' ')); [Console]::Out.Flush()
  }
}
