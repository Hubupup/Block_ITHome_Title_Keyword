<div align="center">
  
[![中文](https://img.shields.io/badge/中文-Chinese-green?style=flat-square)](README.md)
  
</div>

<h1 align="center">ITHome Content Blocker</h1>
<p align="center">
<strong>One-click block unwanted news, banner ads, red packet popups, and promotions on m.ithome.com for a clean reading experience.</strong>
</p>

<h2>✨ Features</h2>
<ul>
<li>🔇 <strong>Keyword Blocking</strong>: Auto-hides news items whose titles contain specified keywords.</li>
<li>🎠 <strong>Carousel Optimization</strong>: Removes matched slides from the top banner without breaking autoplay of the remaining ones.</li>
<li>📵 <strong>Auto Close Bottom Banner</strong>: Simulates a click on the "Open App" bottom banner to close it automatically.</li>
<li>👻 <strong>Hide "Open App" Icon</strong>: Permanently hides the floating "Open in App" button at the bottom-right corner.</li>
<li>🧧 <strong>Remove Red Packet Popup</strong>: Detects and deletes the iframe used for 618/Double 11 promotional popups.</li>
<li>🌐 <strong>Site-wide Coverage</strong>: Works on all subpages of <code>m.ithome.com</code> (homepage, hot list, category pages, etc.).</li>
</ul>

<h2>📸 Screenshots</h2>
<table>
<tr>
<th>Before</th>
<th>After</th>
</tr>
<tr>
<td><img src="ITHome_Before.png" alt="Before"></td>
<td><img src="ITHome_After.png" alt="After"></td>
</tr>
</table>

<h2>🚀 Installation</h2>
<ol>
<li>Install a userscript manager extension:
<ul>
<li><a href="https://www.tampermonkey.net/" target="_blank">Tampermonkey</a> (recommended)</li>
<li><a href="https://violentmonkey.github.io/" target="_blank">Violentmonkey</a></li>
</ul>
</li>
<li>Install the script:
<ul>
<li><strong>Manual install</strong>: Copy the content of <code>Block_ITHome_Title_Keyword.user.js</code> from this repository, create a new script in your manager and paste it.</li>
</ul>
</li>
<li>Refresh m.ithome.com and enjoy.</li>
</ol>

<h2>🔧 Customize Keywords</h2>
<p>Modify the <code>BLOCK_KEYWORDS</code> array at the top of the script to add your own blocked words:</p>
<pre><code class="language-javascript">const BLOCK_KEYWORDS = [
'鸿蒙',
'余承东',
'雷军',
'问界',
'我国',
// Add more keywords...
];
</code></pre>
<p>Save and refresh the page to apply changes.</p>

<h2>📜 License</h2>
<p>MIT License © Hubupup</p>

---

<div align="center">
  
[![中文](https://img.shields.io/badge/中文-Chinese-green?style=flat-square)](README.md)
  
</div>
