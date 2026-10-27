import fs from "fs";
import zlib from "zlib";

// Read zip file manually or using zip
import { execSync } from "child_process";

// Write a powershell script to a file to run cleanly
fs.writeFileSync("scripts/inspect_align.ps1", `
Copy-Item 'C:\\Users\\bdstd\\Downloads\\Format Rekapitulasi Absensi Guru.docx' 'scripts\\temp_copy.docx' -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\\Users\\bdstd\\absensi-guru\\scripts\\temp_copy.docx')
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
Remove-Item 'scripts\\temp_copy.docx' -Force

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\\Users\\bdstd\\absensi-guru\\scripts\\temp_copy.docx')
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
Remove-Item 'scripts\\temp_copy.docx' -Force

Write-Host "--- SECTION & PAGE PROPERTIES ---"
[regex]::Matches($xml, '<w:sectPr.*?</w:sectPr>') | ForEach-Object { Write-Host $_.Value }

`);

const out = execSync("powershell -ExecutionPolicy Bypass -File scripts/inspect_align.ps1").toString();
console.log(out);
fs.unlinkSync("scripts/inspect_align.ps1");
