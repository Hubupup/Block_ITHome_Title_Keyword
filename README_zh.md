<div align="center">
  
[![English](https://img.shields.io/badge/English-English-blue?style=flat-square)](README_en.md)
  
</div>

<h1 align="center">IT之家 内容优化脚本</h1>
<p align="center">
<strong>一键屏蔽关键词新闻、轮播图、红包弹窗及推广元素，还你清爽阅读体验。</strong>
</p>

<h2>✨ 功能特性</h2>
<ul>
<li>🔇 <strong>关键词屏蔽</strong>：自动隐藏标题中包含指定关键词的新闻条目。</li>
<li>🎠 <strong>轮播图优化</strong>：移除轮播图中匹配关键词的幻灯片，且不影响剩余幻灯片的自动播放。</li>
<li>📵 <strong>底部横幅自动关闭</strong>：自动点击并关闭"打开APP"底部横幅。</li>
<li>👻 <strong>隐藏"打开APP"图标</strong>：移除右下角悬浮的"打开APP"按钮。</li>
<li>🧧 <strong>红包弹窗移除</strong>：自动删除618/双11等促销红包iframe，彻底告别弹窗。</li>
<li>🌐 <strong>全站覆盖</strong>：支持首页、热榜、分类等所有移动端子页面 (<code>m.ithome.com/*</code>)。</li>
</ul>

<h2>📸 效果预览</h2>
<table>
<tr>
<th>屏蔽前</th>
<th>屏蔽后</th>
</tr>
<tr>
<td><img src="ITHome_Before.png" alt="屏蔽前"></td>
<td><img src="ITHome_After.png" alt="屏蔽后"></td>
</tr>
</table>

<h2>🚀 安装方法</h2>
<ol>
<li>安装用户脚本管理器扩展：
<ul>
<li><a href="https://www.tampermonkey.net/" target="_blank">Tampermonkey</a>（推荐）</li>
<li><a href="https://violentmonkey.github.io/" target="_blank">Violentmonkey</a></li>
</ul>
</li>
<li>点击下方手动复制脚本代码：
<ul>
<li><strong>手动安装</strong>：复制本仓库中的 <code>Block_ITHome_Title_Keyword.user.js</code> 文件内容，在脚本管理器中新建脚本并粘贴保存。</li>
</ul>
</li>
<li>刷新 IT之家 页面，立即生效。</li>
</ol>

<h2>🔧 自定义关键词</h2>
<p>在脚本开头的 <code>BLOCK_KEYWORDS</code> 数组中修改或添加你想屏蔽的关键词：</p>
<pre><code class="language-javascript">const BLOCK_KEYWORDS = [
'鸿蒙',
'余承东',
'雷军',
'问界',
'我国',
// 添加更多关键词...
];
</code></pre>
<p>保存后刷新页面即可生效。</p>

<h2>📜 许可证</h2>
<p>MIT License © Hubupup</p>

---

<div align="center">
  
[![English](https://img.shields.io/badge/English-English-blue?style=flat-square)](README_en.md)
  
</div>