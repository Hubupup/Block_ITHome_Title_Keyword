// ==UserScript==
// @name         IT之家 综合优化（关键词屏蔽+去红包广告+用户黑名单）
// @name:en      ITome block keyword + moveout fuck AD + userblacklist
// @namespace    https://github.com/Hubupup/Block_ITHome_Title_Keyword/
// @version      3.2
// @description  屏蔽指定关键词新闻，移除轮播图（不影响自动播放），关闭底部横幅，隐藏打开APP图标，移除红包iframe
// @description:en block keyword + moveout fuck AD + userblacklist
// @author       Hubupup
// @match        https://m.ithome.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 默认配置（可通过面板修改，保存在 localStorage） ====================
    const DEFAULT_KEYWORDS = ['鸿蒙', '余承东', '雷军', '问界', '享界', '尊界', '我国'];
    const DEFAULT_MIN_INTERACTION = 4;
    const DEFAULT_DOWNVOTE_RATIO = 4;

    const STORAGE_KEYWORDS = 'ithome_block_keywords';
    const STORAGE_MIN_INTERACTION = 'ithome_comment_min_interaction';
    const STORAGE_DOWNVOTE_RATIO = 'ithome_comment_downvote_ratio';

    function getKeywords() {
        try {
            const data = localStorage.getItem(STORAGE_KEYWORDS);
            if (!data) return [...DEFAULT_KEYWORDS];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [...DEFAULT_KEYWORDS];
        } catch (e) { return [...DEFAULT_KEYWORDS]; }
    }
    function saveKeywords(list) { localStorage.setItem(STORAGE_KEYWORDS, JSON.stringify(list)); }

    function getMinInteraction() {
        const v = localStorage.getItem(STORAGE_MIN_INTERACTION);
        const n = v !== null ? parseInt(v, 10) : DEFAULT_MIN_INTERACTION;
        return isNaN(n) ? DEFAULT_MIN_INTERACTION : n;
    }
    function saveMinInteraction(val) { localStorage.setItem(STORAGE_MIN_INTERACTION, String(val)); }

    function getDownvoteRatio() {
        const v = localStorage.getItem(STORAGE_DOWNVOTE_RATIO);
        const n = v !== null ? parseFloat(v) : DEFAULT_DOWNVOTE_RATIO;
        return isNaN(n) ? DEFAULT_DOWNVOTE_RATIO : n;
    }
    function saveDownvoteRatio(val) { localStorage.setItem(STORAGE_DOWNVOTE_RATIO, String(val)); }

    // ==================== 用户黑名单配置 ====================
    const BLACKLIST_STORAGE_KEY = 'ithome_user_blacklist';

    function normalizeBlacklistItem(item) {
        if (!item) return null;
        if (typeof item === 'string') {
            const name = item.trim();
            return name ? [name, '', ''] : null;
        }
        if (Array.isArray(item)) {
            const name = String(item[0] || '').trim();
            const id = String(item[1] || '').trim();
            const href = String(item[2] || '').trim();
            return (name || id) ? [name, id, href] : null;
        }
        if (typeof item === 'object') {
            const name = String(item['user-name'] || item.username || item.name || '').trim();
            const id = String(item['软媒通行证数字ID'] || item.userId || item.id || '').trim();
            const href = String(item.href || item.url || '').trim();
            return (name || id) ? [name, id, href] : null;
        }
        return null;
    }

    function getBlacklist() {
        try {
            const data = localStorage.getItem(BLACKLIST_STORAGE_KEY);
            if (!data) return [];
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return [];
            return parsed.map(normalizeBlacklistItem).filter(Boolean);
        } catch (e) {
            return [];
        }
    }

    function saveBlacklist(list) {
        localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(list));
    }

    function addToBlacklist(username, userId, href) {
        const list = getBlacklist();
        let exists = false;
        if (userId) {
            exists = list.some(item => item[1] === userId);
        } else if (username) {
            exists = list.some(item => item[0] === username);
        }
        if (!exists) {
            list.push([username || '', userId || '', href || '']);
            saveBlacklist(list);
            console.log('[屏蔽] 已加入黑名单:', username, 'ID:', userId, 'href:', href);
        }
    }

    function removeFromBlacklist(target) {
        const targetId = typeof target === 'object' ? target.userId : target;
        const targetName = typeof target === 'object' ? target.username : target;

        const list = getBlacklist().filter(item => {
            if (targetId && item[1] === targetId) return false;
            if (targetName && item[0] === targetName) return false;
            return true;
        });
        saveBlacklist(list);
        console.log('[屏蔽] 已从黑名单移除:', targetName || targetId);
    }

    function isBlacklisted(info) {
        const list = getBlacklist();
        if (typeof info === 'string') {
            return list.some(item => (item[1] && item[1] === info) || item[0] === info);
        }
        if (info && info.userId) {
            return list.some(item => item[1] === info.userId);
        }
        return false;
    }

    function exportBlacklist() {
        const list = getBlacklist();
        const text = JSON.stringify(list, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ithome_blacklist.json';
        a.click();
        URL.revokeObjectURL(url);
        console.log('[屏蔽] 黑名单已导出，共', list.length, '个用户');
    }

    function importBlacklist() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if (Array.isArray(imported)) {
                        const current = getBlacklist();
                        const normalizedImported = imported.map(normalizeBlacklistItem).filter(Boolean);

                        const mergedMap = new Map();
                        current.forEach(item => {
                            const key = item[1] ? `id_${item[1]}` : `name_${item[0]}`;
                            mergedMap.set(key, item);
                        });

                        let addedCount = 0;
                        normalizedImported.forEach(item => {
                            const idKey = item[1] ? `id_${item[1]}` : null;
                            const nameKey = item[0] ? `name_${item[0]}` : null;

                            if (idKey && mergedMap.has(idKey)) {
                                const exist = mergedMap.get(idKey);
                                if (!exist[0] && item[0]) exist[0] = item[0];
                                if (!exist[2] && item[2]) exist[2] = item[2];
                            } else if (nameKey && mergedMap.has(nameKey)) {
                                const exist = mergedMap.get(nameKey);
                                if (item[1]) {
                                    mergedMap.delete(nameKey);
                                    exist[1] = item[1];
                                    if (item[2]) exist[2] = item[2];
                                    mergedMap.set(`id_${item[1]}`, exist);
                                }
                            } else {
                                const newKey = idKey || nameKey;
                                if (newKey) {
                                    mergedMap.set(newKey, item);
                                    addedCount++;
                                }
                            }
                        });

                        const merged = Array.from(mergedMap.values());
                        saveBlacklist(merged);
                        alert(`黑名单导入成功！新增 ${addedCount} 个用户，共 ${merged.length} 个用户。`);
                        console.log('[屏蔽] 黑名单已导入，共', merged.length, '个用户');
                        // 重新扫描并屏蔽已导入的黑名单用户评论
                        applyBlacklistToComments(document.body);
                    } else {
                        alert('文件格式错误，请选择正确的黑名单 JSON 文件。');
                    }
                } catch (err) {
                    alert('导入失败：' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // ==================== 新闻列表屏蔽 ====================
    function blockList(titleEl) {
        const text = titleEl.innerText.trim();
        if (getKeywords().some(kw => text.includes(kw))) {
            const item = titleEl.closest('.placeholder, .news-item');
            if (item) {
                item.style.display = 'none';
                console.log('[屏蔽] 列表隐藏:', text);
            }
        }
    }

    // ==================== 轮播图屏蔽 ====================
    function getSwiper() {
        const container = document.querySelector('.banner-swiper-container');
        return container?.swiper || null;
    }

    function restartAutoplay(swiper) {
        if (!swiper || !swiper.params || !swiper.autoplay) return;
        if (swiper.params.autoplay && swiper.params.autoplay.enabled !== false) {
            swiper.autoplay.stop();
            setTimeout(() => {
                swiper.autoplay.start();
                console.log('[屏蔽] 自动播放已重启');
            }, 100);
        }
    }

    function removeSlideViaSwiper(swiper, index) {
        if (!swiper.removedIndexes) swiper.removedIndexes = new Set();
        if (swiper.removedIndexes.has(index)) return;
        swiper.removedIndexes.add(index);

        try {
            swiper.removeSlide(index);
            console.log('[屏蔽] Swiper.removeSlide 成功');
            restartAutoplay(swiper);
        } catch (e) {
            console.warn('[屏蔽] removeSlide 异常，改用 DOM 移除', e);
            removeSlideByDOM(index);
            const s = getSwiper();
            if (s) restartAutoplay(s);
        }
    }

    function removeSlideByDOM(index) {
        document.querySelectorAll(`.swiper-slide[data-swiper-slide-index="${index}"]`)
            .forEach(s => s.remove());
        const swiper = getSwiper();
        if (swiper) swiper.update();
    }

    function blockBanner(titleEl) {
        const text = titleEl.innerText.trim();
        if (!getKeywords().some(kw => text.includes(kw))) return;

        const slide = titleEl.closest('.swiper-slide');
        if (!slide) return;

        const realIndex = slide.getAttribute('data-swiper-slide-index');
        if (realIndex === null) return;

        console.log('[屏蔽] 轮播图命中:', text, '索引:', realIndex);

        const swiper = getSwiper();
        if (swiper) {
            removeSlideViaSwiper(swiper, parseInt(realIndex));
        } else {
            setTimeout(() => {
                const s = getSwiper();
                if (s) {
                    removeSlideViaSwiper(s, parseInt(realIndex));
                } else {
                    removeSlideByDOM(realIndex);
                }
            }, 500);
        }
    }

    // ==================== 底部横幅自动关闭 ====================
    function autoCloseBanner() {
        const closeBtn = document.querySelector('.open-app-banner .close-btn');
        if (closeBtn && !closeBtn.dataset.autoClosed) {
            closeBtn.click();
            closeBtn.dataset.autoClosed = 'true';
            console.log('[屏蔽] 自动关闭底部横幅');
        }
    }

    // ==================== 隐藏右下角"打开APP"图标 ====================
    function hideOpenAppIcon() {
        const openAppLink = document.querySelector('.fixed-btn .open-app-a');
        if (openAppLink && openAppLink.style.display !== 'none') {
            openAppLink.style.display = 'none';
            console.log('[屏蔽] 已隐藏右下角"打开APP"图标');
        }
    }

    // ==================== 屏蔽红包 iframe ====================
    function blockHongbaoIframe() {
        const iframes = document.querySelectorAll('iframe[src*="hongbao.html"]');
        iframes.forEach(iframe => {
            if (!iframe.dataset.blocked) {
                iframe.remove();
                iframe.dataset.blocked = 'true';
                console.log('[屏蔽] 已移除红包 iframe');
            }
        });
    }

    // ==================== 评论屏蔽 ====================
    function parseVoteCount(text) {
        const match = text.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    function shouldBlockComment(upvotes, downvotes) {
        const total = upvotes + downvotes;
        if (total < getMinInteraction()) return false;
        if (upvotes === 0) return downvotes > 0;
        return (downvotes / upvotes) >= getDownvoteRatio();
    }

    function blockComment(commentItem) {
        if (commentItem.dataset.commentBlocked) return;
        commentItem.dataset.commentBlocked = 'true';
        commentItem.style.display = 'none';
        const userEl = commentItem.querySelector('.comment-header, .username, [class*="name"]');
        const userName = userEl ? userEl.innerText.trim().split(' ')[0] : '未知用户';
        console.log(`[屏蔽] 评论已隐藏: ${userName} (支持:${commentItem.dataset.upvotes}, 反对:${commentItem.dataset.downvotes}, 比例:${commentItem.dataset.ratio})`);
    }

    function processCommentVotes(voteContainer) {
        const spans = voteContainer.querySelectorAll('span');
        let upvotes = 0;
        let downvotes = 0;

        spans.forEach(span => {
            const text = span.innerText.trim();
            if (text.includes('支持')) {
                upvotes = parseVoteCount(text);
            } else if (text.includes('反对')) {
                downvotes = parseVoteCount(text);
            }
        });

        const commentItem = voteContainer.closest('.comment-item, [class*="comment"], li');
        if (!commentItem) return;

        commentItem.dataset.upvotes = upvotes;
        commentItem.dataset.downvotes = downvotes;
        const ratio = upvotes > 0 ? (downvotes / upvotes).toFixed(2) : '∞';
        commentItem.dataset.ratio = ratio;

        if (shouldBlockComment(upvotes, downvotes)) {
            blockComment(commentItem);
        }
    }

    function scanComments(root) {
        // 基于XPath推断的选择器: 评论项内的投票区域
        // 支持多种可能的选择器，提高兼容性
        const selectors = [
            '.comment-vote span',           // 你的HTML示例结构
            '.comment-item span',           // 通用评论项内span
            '[class*="vote"] span',         // 包含vote的class
            '[class*="zan"] span',          // 包含zan(赞)的class
            '[class*="support"] span',      // 包含support的class
            'li span',                      // li内的span（兜底）
        ];

        const processed = new Set();

        selectors.forEach(selector => {
            const elements = root.querySelectorAll ? root.querySelectorAll(selector) : [];
            elements.forEach(el => {
                const text = el.innerText.trim();
                // 只处理包含"支持"或"反对"的span
                if ((text.includes('支持') || text.includes('反对')) && !processed.has(el)) {
                    processed.add(el);
                    // 找到该span的父容器（包含所有投票按钮的容器）
                    const voteContainer = el.closest('.comment-vote') || el.parentElement;
                    if (voteContainer && !voteContainer.dataset.voteProcessed) {
                        voteContainer.dataset.voteProcessed = 'true';
                        processCommentVotes(voteContainer);
                    }
                }
            });
        });
    }

    // ==================== 用户黑名单屏蔽 ====================
    function getUserInfo(nameEl) {
        if (!nameEl) return { username: '', userId: '', href: '' };
        const username = nameEl.innerText ? nameEl.innerText.trim() : '';
        let linkEl = nameEl.closest('a') || nameEl.parentElement?.closest('a') || (nameEl.tagName === 'A' ? nameEl : null);

        let href = '';
        let title = '';

        if (linkEl) {
            href = linkEl.getAttribute('href') || linkEl.href || '';
            title = linkEl.getAttribute('title') || linkEl.title || '';
        }

        // 如果当前链接无 title，尝试从同一评论项中提取头像或用户信息链接的 title
        if (!title) {
            const li = nameEl.closest('li');
            if (li) {
                const anyUserLink = li.querySelector('a[title*="数字ID"]') || li.querySelector('a[title*="通行证"]');
                if (anyUserLink) {
                    title = anyUserLink.getAttribute('title') || anyUserLink.title || '';
                    if (!href) href = anyUserLink.getAttribute('href') || anyUserLink.href || '';
                }
            }
        }

        let userId = '';
        if (title) {
            const m = title.match(/(?:数字ID[：:]\s*)(\d+)/i) || title.match(/\d+/);
            if (m) {
                userId = m[1] || m[0] || '';
            }
        }

        return { username, userId, href };
    }

    function checkAndUpdateBlacklist(info) {
        if (!info) return false;
        const list = getBlacklist();
        let updated = false;
        let isBlocked = false;

        // 1. 根据软媒通行证数字ID进行屏蔽（不再根据用户名屏蔽）
        if (info.userId) {
            if (list.some(item => item[1] === info.userId)) {
                isBlocked = true;
            }
        }

        // 2. 兼容旧黑名单：对比原本已拉黑但没保存过用户id和href的用户(只保存了用户名user-name)，
        //    遇到相同名字，更新黑名单，为其添加用户id和href
        if (info.username && info.userId) {
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                if (item[0] === info.username && !item[1]) {
                    item[1] = info.userId;
                    item[2] = info.href || item[2] || '';
                    updated = true;
                    isBlocked = true;
                    console.log(`[屏蔽] 兼容旧黑名单：已为用户 "${info.username}" 补全通行证ID (${info.userId}) 和链接`);
                }
            }
        }

        if (updated) {
            saveBlacklist(list);
        }

        return isBlocked;
    }

    function hideUserComments(info) {
        document.querySelectorAll('.user-name').forEach(el => {
            const otherInfo = getUserInfo(el);
            const matchId = info.userId && otherInfo.userId === info.userId;
            const matchName = !info.userId && info.username && otherInfo.username === info.username;
            if (matchId || matchName) {
                const btn = el.parentNode?.querySelector('.block-user-btn');
                if (btn) {
                    btn.textContent = '已屏蔽';
                    btn.style.background = '#999';
                }
                const li = el.closest('li');
                if (li && !li.dataset.userBlacklisted) {
                    li.dataset.userBlacklisted = 'true';
                    li.style.display = 'none';
                }
            }
        });
    }

    function restoreUserComments(target) {
        const targetId = typeof target === 'object' ? target.userId : target;
        const targetName = typeof target === 'object' ? target.username : target;
        document.querySelectorAll('.user-name').forEach(el => {
            const otherInfo = getUserInfo(el);
            const matchId = targetId && otherInfo.userId === targetId;
            const matchName = targetName && otherInfo.username === targetName;
            if (matchId || matchName) {
                const btn = el.parentNode?.querySelector('.block-user-btn');
                if (btn) {
                    btn.textContent = '屏蔽';
                    btn.style.background = '#d22222';
                }
                const li = el.closest('li');
                if (li && li.dataset.userBlacklisted) {
                    delete li.dataset.userBlacklisted;
                    li.style.display = '';
                }
            }
        });
    }

    function addBlockButton(nameEl, info) {
        if (nameEl.dataset.blockBtnAdded) return;
        nameEl.dataset.blockBtnAdded = 'true';

        if (!info) info = getUserInfo(nameEl);
        if (!info.username && !info.userId) return;

        const isBlocked = checkAndUpdateBlacklist(info);

        const btn = document.createElement('span');
        btn.className = 'block-user-btn';
        btn.style.cssText = 'display:inline-block;margin-left:6px;padding:1px 6px;font-size:10px;color:#fff;background:#d22222;border-radius:3px;cursor:pointer;vertical-align:middle;line-height:1.6;user-select:none;';

        if (isBlocked) {
            btn.textContent = '已屏蔽';
            btn.style.background = '#999';
        } else {
            btn.textContent = '屏蔽';
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentInfo = getUserInfo(nameEl);
            const currentlyBlocked = isBlacklisted(currentInfo);

            if (currentlyBlocked) {
                const label = currentInfo.userId ? `"${currentInfo.username}" (ID: ${currentInfo.userId})` : `"${currentInfo.username}"`;
                if (confirm(`确定将 ${label} 从黑名单移除吗？`)) {
                    removeFromBlacklist(currentInfo);
                    restoreUserComments(currentInfo);
                }
            } else {
                const label = currentInfo.userId ? `"${currentInfo.username}" (ID: ${currentInfo.userId})` : `"${currentInfo.username}"`;
                if (confirm(`确定将 ${label} 加入黑名单吗？该用户的所有评论将被隐藏。`)) {
                    addToBlacklist(currentInfo.username, currentInfo.userId, currentInfo.href);
                    hideUserComments(currentInfo);
                }
            }
        });

        nameEl.parentNode.insertBefore(btn, nameEl.nextSibling);
    }

    function blockBlacklistedUserComment(nameEl, info) {
        if (!info) info = getUserInfo(nameEl);
        const isBlocked = checkAndUpdateBlacklist(info);
        if (!isBlocked) return;
        const li = nameEl.closest('li');
        if (li && !li.dataset.userBlacklisted) {
            li.dataset.userBlacklisted = 'true';
            li.style.display = 'none';
            console.log(`[屏蔽] 黑名单用户评论已隐藏: ${info.username} (ID: ${info.userId || '无'})`);
        }
    }

    function applyBlacklistToComments(root) {
        const nameEls = root.querySelectorAll ? root.querySelectorAll('.user-name') : [];
        nameEls.forEach(el => {
            const info = getUserInfo(el);
            addBlockButton(el, info);
            blockBlacklistedUserComment(el, info);
        });
    }

    // ==================== 黑名单管理弹窗 ====================
    function openBlacklistModal() {
        const existing = document.getElementById('ithome-blacklist-modal-mask');
        if (existing) existing.remove();

        const mask = document.createElement('div');
        mask.id = 'ithome-blacklist-modal-mask';
        mask.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';

        const card = document.createElement('div');
        card.style.cssText = 'background:#fff;border-radius:10px;width:100%;max-width:380px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,0.25);overflow:hidden;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

        // 头部 Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #eee;';
        const title = document.createElement('div');
        title.style.cssText = 'font-size:15px;font-weight:600;color:#333;';
        const closeBtn = document.createElement('div');
        closeBtn.style.cssText = 'font-size:20px;color:#999;cursor:pointer;line-height:1;padding:0 4px;user-select:none;';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => mask.remove();
        header.appendChild(title);
        header.appendChild(closeBtn);

        // 列表 List（可独立滚动）
        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'flex:1;overflow-y:auto;padding:8px 16px;max-height:48vh;-webkit-overflow-scrolling:touch;';

        function renderList() {
            const list = getBlacklist();
            title.textContent = `黑名单列表 (${list.length}人)`;

            // 同步更新管理菜单中的总数
            const listCount = document.querySelector('#blacklist-menu > div:first-child');
            if (listCount) {
                listCount.textContent = `黑名单: ${list.length} 人`;
            }

            listContainer.innerHTML = '';
            if (list.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'text-align:center;color:#999;font-size:13px;padding:30px 0;';
                empty.textContent = '暂无黑名单用户';
                listContainer.appendChild(empty);
                return;
            }

            list.forEach(item => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f2f2f2;gap:8px;';

                const infoDiv = document.createElement('div');
                infoDiv.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;flex:1;';

                const nameSpan = document.createElement('div');
                nameSpan.style.cssText = 'font-size:13px;font-weight:500;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                nameSpan.textContent = item[0] || '未知用户名';

                const idSpan = document.createElement('div');
                idSpan.style.cssText = 'font-size:11px;color:#888;margin-top:2px;';
                idSpan.textContent = item[1] ? `ID: ${item[1]}` : '待匹配通行证ID';

                infoDiv.appendChild(nameSpan);
                infoDiv.appendChild(idSpan);

                const delBtn = document.createElement('button');
                delBtn.style.cssText = 'padding:3px 10px;font-size:11px;color:#d22222;background:#fff;border:1px solid #d22222;border-radius:4px;cursor:pointer;flex-shrink:0;';
                delBtn.textContent = '移除';
                delBtn.onclick = () => {
                    const target = item[1] || item[0];
                    removeFromBlacklist(target);
                    restoreUserComments(target);
                    renderList();
                };

                row.appendChild(infoDiv);
                row.appendChild(delBtn);
                listContainer.appendChild(row);
            });
        }

        renderList();

        // 底部 Footer（批量输入与关闭）
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:12px 16px;border-top:1px solid #eee;background:#fafafa;display:flex;flex-direction:column;gap:8px;';

        const inputRow = document.createElement('div');
        inputRow.style.cssText = 'display:flex;gap:6px;align-items:center;';

        const batchInput = document.createElement('input');
        batchInput.type = 'text';
        batchInput.placeholder = '输入ID或用户名(逗号分隔)';
        batchInput.style.cssText = 'flex:1;min-width:0;padding:6px 8px;font-size:12px;border:1px solid #ddd;border-radius:4px;outline:none;box-sizing:border-box;';

        const batchBtn = document.createElement('button');
        batchBtn.textContent = '批量移除';
        batchBtn.style.cssText = 'padding:6px 12px;font-size:12px;color:#fff;background:#d22222;border:none;border-radius:4px;cursor:pointer;white-space:nowrap;flex-shrink:0;';
        batchBtn.onclick = () => {
            const val = batchInput.value.trim();
            if (!val) return;
            const removeItems = val.split(/[,，]/).map(s => s.trim()).filter(Boolean);
            if (removeItems.length === 0) return;
            removeItems.forEach(target => {
                removeFromBlacklist(target);
                restoreUserComments(target);
            });
            batchInput.value = '';
            renderList();
        };

        inputRow.appendChild(batchInput);
        inputRow.appendChild(batchBtn);

        const closeCardBtn = document.createElement('button');
        closeCardBtn.textContent = '关闭';
        closeCardBtn.style.cssText = 'width:100%;padding:7px;font-size:12px;color:#666;background:#fff;border:1px solid #ddd;border-radius:4px;cursor:pointer;';
        closeCardBtn.onclick = () => mask.remove();

        footer.appendChild(inputRow);
        footer.appendChild(closeCardBtn);

        card.appendChild(header);
        card.appendChild(listContainer);
        card.appendChild(footer);
        mask.appendChild(card);

        mask.onclick = (e) => {
            if (e.target === mask) mask.remove();
        };

        document.body.appendChild(mask);
    }

    // ==================== 黑名单管理面板 ====================
    function createBlacklistPanel() {
        if (document.getElementById('blacklist-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'blacklist-panel';
        panel.style.cssText = 'position:fixed;bottom:60px;right:10px;z-index:99999;display:flex;flex-direction:column;gap:4px;';

        // 管理按钮
        const mgrBtn = document.createElement('div');
        mgrBtn.id = 'blacklist-mgr-btn';
        mgrBtn.style.cssText = 'width:40px;height:40px;border-radius:50%;background:#d22222;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);user-select:none;';
        mgrBtn.textContent = '黑名单';

        // 操作菜单（默认隐藏）
        const menu = document.createElement('div');
        menu.id = 'blacklist-menu';
        menu.style.cssText = 'display:none;flex-direction:column;gap:4px;padding:8px;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.2);';

        const listCount = document.createElement('div');
        listCount.style.cssText = 'font-size:12px;color:#666;text-align:center;padding:2px 0;';
        listCount.textContent = `黑名单: ${getBlacklist().length} 人`;

        const exportBtn = document.createElement('div');
        exportBtn.style.cssText = 'padding:6px 12px;font-size:12px;color:#333;background:#f5f5f5;border-radius:4px;cursor:pointer;text-align:center;';
        exportBtn.textContent = '导出黑名单';
        exportBtn.onclick = (e) => { e.stopPropagation(); exportBlacklist(); };

        const importBtn = document.createElement('div');
        importBtn.style.cssText = 'padding:6px 12px;font-size:12px;color:#333;background:#f5f5f5;border-radius:4px;cursor:pointer;text-align:center;';
        importBtn.textContent = '导入黑名单';
        importBtn.onclick = (e) => { e.stopPropagation(); importBlacklist(); };

        const viewBtn = document.createElement('div');
        viewBtn.style.cssText = 'padding:6px 12px;font-size:12px;color:#333;background:#f5f5f5;border-radius:4px;cursor:pointer;text-align:center;';
        viewBtn.textContent = '查看黑名单';
        viewBtn.onclick = (e) => {
            e.stopPropagation();
            openBlacklistModal();
        };

        menu.appendChild(listCount);
        menu.appendChild(viewBtn);
        menu.appendChild(exportBtn);
        menu.appendChild(importBtn);

        // ===== 分隔线 =====
        const sep = document.createElement('hr');
        sep.style.cssText = 'border:none;border-top:1px solid #eee;margin:4px 0;';
        menu.appendChild(sep);

        // ===== 关键词屏蔽配置 =====
        const kwLabel = document.createElement('div');
        kwLabel.style.cssText = 'font-size:11px;color:#999;padding:2px 0;';
        kwLabel.textContent = '屏蔽关键词（逗号分隔）';
        menu.appendChild(kwLabel);

        const kwInput = document.createElement('textarea');
        kwInput.style.cssText = 'width:200px;height:60px;font-size:11px;padding:4px;border:1px solid #ddd;border-radius:4px;resize:vertical;box-sizing:border-box;';
        kwInput.value = getKeywords().join(', ');
        menu.appendChild(kwInput);

        const kwSaveBtn = document.createElement('div');
        kwSaveBtn.style.cssText = 'padding:4px 12px;font-size:11px;color:#fff;background:#4a90d9;border-radius:4px;cursor:pointer;text-align:center;';
        kwSaveBtn.textContent = '保存关键词';
        kwSaveBtn.onclick = (e) => {
            e.stopPropagation();
            const newKw = kwInput.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
            saveKeywords(newKw);
            alert('屏蔽关键词已保存，共 ' + newKw.length + ' 个：' + newKw.join('、'));
        };
        menu.appendChild(kwSaveBtn);

        // ===== 评论屏蔽配置 =====
        const sep2 = document.createElement('hr');
        sep2.style.cssText = 'border:none;border-top:1px solid #eee;margin:4px 0;';
        menu.appendChild(sep2);

        const voteLabel = document.createElement('div');
        voteLabel.style.cssText = 'font-size:11px;color:#999;padding:2px 0;';
        voteLabel.textContent = '评论屏蔽配置';
        menu.appendChild(voteLabel);

        // 最小互动数
        const minRow = document.createElement('div');
        minRow.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11px;color:#333;padding:2px 0;';
        const minLabel = document.createElement('span');
        minLabel.textContent = '最小互动数:';
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.min = '1';
        minInput.style.cssText = 'width:50px;font-size:11px;padding:2px 4px;border:1px solid #ddd;border-radius:3px;';
        minInput.value = getMinInteraction();
        minRow.appendChild(minLabel);
        minRow.appendChild(minInput);
        menu.appendChild(minRow);

        // 反对比例阈值
        const ratioRow = document.createElement('div');
        ratioRow.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11px;color:#333;padding:2px 0;';
        const ratioLabel = document.createElement('span');
        ratioLabel.textContent = '反对/支持≥';
        const ratioInput = document.createElement('input');
        ratioInput.type = 'number';
        ratioInput.min = '1';
        ratioInput.step = '0.5';
        ratioInput.style.cssText = 'width:50px;font-size:11px;padding:2px 4px;border:1px solid #ddd;border-radius:3px;';
        ratioInput.value = getDownvoteRatio();
        const ratioHint = document.createElement('span');
        ratioHint.textContent = '时屏蔽';
        ratioRow.appendChild(ratioLabel);
        ratioRow.appendChild(ratioInput);
        ratioRow.appendChild(ratioHint);
        menu.appendChild(ratioRow);

        const voteSaveBtn = document.createElement('div');
        voteSaveBtn.style.cssText = 'padding:4px 12px;font-size:11px;color:#fff;background:#4a90d9;border-radius:4px;cursor:pointer;text-align:center;margin-top:2px;';
        voteSaveBtn.textContent = '保存评论配置';
        voteSaveBtn.onclick = (e) => {
            e.stopPropagation();
            const minVal = parseInt(minInput.value, 10);
            const ratioVal = parseFloat(ratioInput.value);
            if (isNaN(minVal) || minVal < 1) { alert('最小互动数必须 ≥ 1'); return; }
            if (isNaN(ratioVal) || ratioVal < 1) { alert('反对比例阈值必须 ≥ 1'); return; }
            saveMinInteraction(minVal);
            saveDownvoteRatio(ratioVal);
            alert(`评论屏蔽配置已保存：\n最小互动数 = ${minVal}\n反对/支持比例 ≥ ${ratioVal}`);
        };
        menu.appendChild(voteSaveBtn);

        let menuOpen = false;
        mgrBtn.onclick = () => {
            menuOpen = !menuOpen;
            menu.style.display = menuOpen ? 'flex' : 'none';
            listCount.textContent = `黑名单: ${getBlacklist().length} 人`;
        };

        // 点击其他区域关闭菜单
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && menuOpen) {
                menuOpen = false;
                menu.style.display = 'none';
            }
        });

        panel.appendChild(menu);
        panel.appendChild(mgrBtn);
        document.body.appendChild(panel);
    }

    // ==================== 动态监听 ====================
    function observeDOM() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;

                    // 新闻列表
                    if (node.classList?.contains('placeholder')) {
                        const t = node.querySelector('.plc-title');
                        if (t) blockList(t);
                    }
                    node.querySelectorAll?.('.plc-title').forEach(blockList);
                    node.querySelectorAll?.('.slide-title').forEach(blockBanner);

                    // 横幅关闭按钮
                    if (node.querySelector?.('.open-app-banner .close-btn')) {
                        autoCloseBanner();
                    }

                    // 右下角打开APP按钮
                    if (node.querySelector?.('.fixed-btn .open-app-a')) {
                        hideOpenAppIcon();
                    }

                    // 红包 iframe
                    if (node.tagName === 'IFRAME' && node.src.includes('hongbao.html')) {
                        blockHongbaoIframe();
                    }
                    node.querySelectorAll?.('iframe[src*="hongbao.html"]').forEach(() => blockHongbaoIframe());

                    // ===== 评论区动态加载检测 =====
                    // 如果新增节点包含评论相关结构，扫描评论
                    if (node.classList?.contains('comment-item') ||
                        node.classList?.contains('comment-section') ||
                        node.querySelector?.('.comment-item') ||
                        node.querySelector?.('.comment-vote') ||
                        node.querySelector?.('.user-name') ||
                        node.tagName === 'LI') {
                        scanComments(node);
                        applyBlacklistToComments(node);
                    }
                });

                hideOpenAppIcon();
                blockHongbaoIframe();

                // 属性变化时也可能需要重新检查评论（如投票数动态更新）
                if (m.type === 'attributes') {
                    const target = m.target;
                    if (target.nodeType === 1) {
                        const text = target.innerText || '';
                        if (text.includes('支持') || text.includes('反对')) {
                            const voteContainer = target.closest('.comment-vote') || target.parentElement;
                            if (voteContainer) {
                                voteContainer.dataset.voteProcessed = '';
                                processCommentVotes(voteContainer);
                            }
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'innerText', 'textContent']
        });
    }

    // ==================== 初始化 ====================
    function init() {
        console.log('[屏蔽] 脚本启动 v3.1');
        document.querySelectorAll('.plc-title').forEach(blockList);
        document.querySelectorAll('.slide-title').forEach(blockBanner);
        autoCloseBanner();
        hideOpenAppIcon();
        blockHongbaoIframe();
        scanComments(document.body); // 初始化时扫描已有评论
        applyBlacklistToComments(document.body); // 初始化时扫描黑名单用户
        createBlacklistPanel(); // 创建黑名单管理面板
        observeDOM();

        setTimeout(() => {
            document.querySelectorAll('.slide-title').forEach(blockBanner);
            hideOpenAppIcon();
            blockHongbaoIframe();
            scanComments(document.body); // 延迟再次扫描评论（应对懒加载）
            applyBlacklistToComments(document.body);
        }, 1000);

        // 评论区通常是滚动加载，额外添加滚动监听
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                scanComments(document.body);
                applyBlacklistToComments(document.body);
            }, 300);
        }, { passive: true });
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init, { once: true });
    }
})();
