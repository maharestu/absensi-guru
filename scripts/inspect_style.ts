import fs from "fs";
import { execSync } from "child_process";

fs.writeFileSync("scripts/inspect_style.ps1", `
Copy-Item 'C:\\Users\\bdstd\\Downloads\\Format Rekapitulasi Absensi Guru.docx' 'scripts\\temp_copy2.docx' -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\\Users\\bdstd\\absensi-guru\\scripts\\temp_copy2.docx')
$entry = $zip.GetEntry('word/styles.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
Remove-Item 'scripts\\temp_copy2.docx' -Force

[regex]::Matches($xml, '<w:style [^>]*w:styleId="TableParagraph"[^>]*>.*?</w:style>') | ForEach-Object { Write-Host $_.Value }
`);

const out = execSync("powershell -ExecutionPolicy Bypass -File scripts/inspect_style.ps1").toString();
console.log(out);
fs.unlinkSync("scripts/inspect_style.ps1");
