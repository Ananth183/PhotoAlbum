# Rebuilds Images/album-data.js (photo list + captions) and keeps Images/captions.json in sync.
# Run after adding, removing or renaming photos:  .\update-images.ps1
# captions.json: new photos get an empty caption to fill in; captions you wrote are kept;
# entries for photos that no longer exist are removed.
$dir = Join-Path $PSScriptRoot "Images"
$ext = '\.(png|jpe?g|gif|webp|avif|bmp)$'
$utf8 = New-Object System.Text.UTF8Encoding $false

$files = @(Get-ChildItem -Path $dir -File |
    Where-Object { $_.Name -match $ext } |
    Sort-Object { [regex]::Replace($_.Name, '\d+', { param($m) $m.Value.PadLeft(10, '0') }) } |
    ForEach-Object { $_.Name })

$capPath = Join-Path $dir "captions.json"
$old = @{}
if (Test-Path $capPath) {
    $parsed = Get-Content $capPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($parsed) { $parsed.PSObject.Properties | ForEach-Object { $old[$_.Name] = [string]$_.Value } }
}
$new = [ordered]@{}
foreach ($f in $files) { $new[$f] = if ($old.ContainsKey($f)) { $old[$f] } else { "" } }
[System.IO.File]::WriteAllText($capPath, (ConvertTo-Json -InputObject $new) + "`n", $utf8)

# album-data.js is loaded as a script, so it also works when the page is opened from disk (file://).
$data = ConvertTo-Json -Depth 3 -InputObject ([ordered]@{ images = $files; captions = $new })
[System.IO.File]::WriteAllText((Join-Path $dir "album-data.js"), "window.ALBUM_DATA = $data;`n", $utf8)

Write-Host "Updated captions.json and album-data.js ($($files.Count) photo(s))."
