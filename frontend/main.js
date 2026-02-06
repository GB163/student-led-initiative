import Prism from 'prismjs';
import 'prismjs/components/prism-powershell';

const code = "Get-Process | Where-Object {$_.CPU -gt 100}";
const highlightedCode = Prism.highlight(code, Prism.languages.powershell, 'powershell');

console.log(highlightedCode);
