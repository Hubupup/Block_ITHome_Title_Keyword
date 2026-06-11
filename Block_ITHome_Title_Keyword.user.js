// ==UserScript==
// @name         IT之家 综合优化（关键词屏蔽+去红包广告）
// @namespace    https://github.com/Hubupup/Block_ITHome_Title_Keyword/
// @version      2.3
// @description  屏蔽指定关键词新闻，移除轮播图（不影响自动播放），关闭底部横幅，隐藏打开APP图标，移除红包iframe
// @author       Hubupup
// @match        https://m.ithome.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const BLOCK_KEYWORDS = [
        '鸿蒙',
        '余承东',
        '雷军',
        '问界',
        '享界',
        '尊界',
        '我国',
    ];

    // ==================== 评论屏蔽配置 ====================
    // 最小互动数阈值：支持+反对总数达到此值才进行比例判断
    const COMMENT_MIN_INTERACTION = 4;
    // 反对/支持比例阈值：达到此比例则屏蔽该评论（ 反对数 ≥ 支持数×COMMENT_DOWNVOTE_RATIO）
    const COMMENT_DOWNVOTE_RATIO = 4;

    // ==================== 新闻列表屏蔽 ====================
    function blockList(titleEl) {
        const text = titleEl.innerText.trim();
        if (BLOCK_KEYWORDS.some(kw => text.includes(kw))) {
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
        if (!BLOCK_KEYWORDS.some(kw => text.includes(kw))) return;

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
        if (total < COMMENT_MIN_INTERACTION) return false;
        if (upvotes === 0) return downvotes > 0;
        return (downvotes / upvotes) >= COMMENT_DOWNVOTE_RATIO;
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
                        node.tagName === 'LI') {
                        scanComments(node);
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
        console.log('[屏蔽] 脚本启动 v2.1');
        document.querySelectorAll('.plc-title').forEach(blockList);
        document.querySelectorAll('.slide-title').forEach(blockBanner);
        autoCloseBanner();
        hideOpenAppIcon();
        blockHongbaoIframe();
        scanComments(document.body); // 初始化时扫描已有评论
        observeDOM();

        setTimeout(() => {
            document.querySelectorAll('.slide-title').forEach(blockBanner);
            hideOpenAppIcon();
            blockHongbaoIframe();
            scanComments(document.body); // 延迟再次扫描评论（应对懒加载）
        }, 1000);

        // 评论区通常是滚动加载，额外添加滚动监听
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                scanComments(document.body);
            }, 300);
        }, { passive: true });
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init, { once: true });
    }
})();
