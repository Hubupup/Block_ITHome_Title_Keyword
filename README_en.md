<div align="center">
  
[![中文](https://img.shields.io/badge/中文-Chinese-green?style=flat-square)](README.md)
  
</div>

<h1 align="center">ITHome Content Blocker</h1>
<p align="center">
<strong>One-click block unwanted news, banner ads, red packet popups, low-quality comments and annoying users on m.ithome.com for a clean reading experience.</strong>
</p>

<h2>✨ Features</h2>
<ul>
<li>🔇 <strong>Keyword Blocking</strong>: Auto-hides news items whose titles contain specified keywords.</li>
<li>🎠 <strong>Carousel Optimization</strong>: Removes matched slides from the top banner without breaking autoplay of the remaining ones.</li>
<li>📵 <strong>Auto Close Bottom Banner</strong>: Simulates a click on the "Open App" bottom banner to close it automatically.</li>
<li>👻 <strong>Hide "Open App" Icon</strong>: Permanently hides the floating "Open in App" button at the bottom-right corner.</li>
<li>🧧 <strong>Remove Red Packet Popup</strong>: Detects and deletes the iframe used for 618/Double 11 promotional popups.</li>
<li>👎 <strong>Low-Quality Comment Blocking</strong>: Auto-hides comments with high downvote/upvote ratio, with configurable thresholds.</li>
<li>🚫 <strong>User Blacklist</strong>: A "Block" button appears next to each username in comments — one click to blacklist a user and hide all their comments.</li>
<li>📥📤 <strong>Blacklist Import/Export</strong>: Export blacklist as a JSON file for backup; import with automatic merge and deduplication.</li>
<li>⚙️ <strong>Visual Config Panel</strong>: A management button at the bottom-right corner lets you edit keywords and comment blocking thresholds directly on the page — no code editing needed.</li>
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
<table>
<tr>
<th>Dashboard & block button</th>
</tr>
<tr>
<td><img src="ITHome_CommentList.png" alt="dashboard"></td>
</tr>
</table>

<h2>🚀 Installation</h2>
<ol>
<li>Install a userscript manager extension:
<ul>
<li><a href="https://www.tampermonkey.net/" target="_blank">Tampermonkey</a> (recommended)</li>
<li><a href="https://violentmonkey.github.io/" target="_blank">Violentmonkey</a></li>
<li><a href="https://scriptcat.org/" 
target="_blank">Script Cat</a></li>
</ul>
</li>
<li>Install the script:
<ul>
<li><strong>Manual install</strong>: Copy the content of <code>Block_ITHome_Title_Keyword.user.js</code> from this repository, create a new script in your manager and paste it.</li>
</ul>
</li>
<li>Refresh m.ithome.com and enjoy.</li>
</ol>

<h2>🔧 Customization</h2>
<p>All settings can be configured directly on the page via the <strong>"Blacklist" management button</strong> in the bottom-right corner. Changes are saved to the browser's localStorage automatically — no code editing required.</p>

<h3>Blocked Keywords</h3>
<p>Enter keywords in the text area of the config panel (separated by commas), then click "Save Keywords" to apply.</p>

<h3>Comment Blocking Settings</h3>
<ul>
<li><strong>Min Interaction Count</strong>: Total upvotes + downvotes must reach this value before ratio judgment (default: 4)</li>
<li><strong>Downvote/Upvote Ratio Threshold</strong>: Comments with downvotes ÷ upvotes ≥ this value are hidden (default: 4)</li>
</ul>

<h3>User Blacklist</h3>
<ul>
<li>A red <strong>"Block" button</strong> appears next to each username in comments — click to add the user to the blacklist</li>
<li>Blocked users show a grey <strong>"Blocked" button</strong> — click again to remove from blacklist</li>
<li>Blacklist supports <strong>export</strong> to JSON file and <strong>import</strong> (auto-merge with deduplication)</li>
<li>Use <strong>"View Blacklist"</strong> in the panel to see all blacklisted users and batch-remove them</li>
</ul>

<h3>Manual Config Editing (Optional)</h3>
<p>To change default values in the code, modify the <code>DEFAULT_KEYWORDS</code> array at the top of the script:</p>
<pre><code class="language-javascript">const DEFAULT_KEYWORDS = [];
</code></pre>
<p>Defaults are used on first load. Once you save settings via the panel, they override the defaults.</p>

<h2>📜 License</h2>
<p>MIT License © Hubupup</p>

---

<div align="center">
  
[![中文](https://img.shields.io/badge/中文-Chinese-green?style=flat-square)](README.md)
  
</div>
