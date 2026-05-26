// ==UserScript==
// @name         IT之家 综合优化（关键词屏蔽+去红包广告）
// @namespace    https://github.com/Hubupup/Block_ITHome_Title_Keyword/
// @version      2.1
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
        '我国',
    ];

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

    // ==================== 隐藏右下角“打开APP”图标 ====================
    function hideOpenAppIcon() {
        const openAppLink = document.querySelector('.fixed-btn .open-app-a');
        if (openAppLink && openAppLink.style.display !== 'none') {
            openAppLink.style.display = 'none';
            console.log('[屏蔽] 已隐藏右下角“打开APP”图标');
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
                });

                hideOpenAppIcon();
                blockHongbaoIframe();
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
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
        observeDOM();

        setTimeout(() => {
            document.querySelectorAll('.slide-title').forEach(blockBanner);
            hideOpenAppIcon();
            blockHongbaoIframe();
        }, 1000);
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init, { once: true });
    }
})();