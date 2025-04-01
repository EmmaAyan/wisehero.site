// 全局变量
let allHighlightedElements = [];  // 所有高亮元素
let currentHighlightedIndex = -1; // 当前高亮索引（从0开始）
let currentHighlightedElement = null; // 当前高亮元素

// 在搜索框输入内容并按回车键时执行搜索
function handleSearchInput(event) {
    const searchInput = event.target;
    const query = searchInput.value.trim();
    
    if (event.key === 'Enter' && query.length >= 2) {
        event.preventDefault();
        
        if (allHighlightedElements.length > 0) {
            // 已有高亮元素，高亮下一个
            highlightNextMatch();
        } else {
            // 没有高亮元素，进行初始搜索
            searchAndHighlightAll(query);
        }
    }
}

// 搜索并高亮所有匹配内容
function searchAndHighlightAll(query) {
    console.log(`执行搜索: "${query}"`);
    
    // 清除现有高亮
    clearAllHighlights();
    
    // 获取所有内容元素
    const contentElements = document.querySelectorAll('h1, h2, h3, h4, p, a, li, span:not(.highlight-index)');
    console.log(`找到 ${contentElements.length} 个可能包含文本的元素`);
    
    // 创建正则表达式
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    let matchCount = 0;
    
    // 处理每个元素
    contentElements.forEach(element => {
        // 跳过搜索UI和隐藏元素
        if (element.closest('.nav-buttons') || 
            element.closest('#search-results') || 
            element.hasAttribute('data-no-search') ||
            element.classList.contains('search-ui') ||
            element.classList.contains('highlight-index') ||
            (element.closest('#moreTemplates') && element.closest('#moreTemplates').classList.contains('hidden'))) {
            return;
        }
        
        // 保存原始内容
        if (!element.dataset.originalContent) {
            element.dataset.originalContent = element.innerHTML;
        }
        
        // 检查是否包含查询词
        const text = element.textContent;
        if (text && text.toLowerCase().includes(query.toLowerCase())) {
            // 高亮匹配文本
            element.innerHTML = element.dataset.originalContent.replace(regex, (match) => {
                matchCount++;
                return `<span class="highlighted-match" data-match-index="${matchCount}">${match}</span>`;
            });
        }
    });
    
    console.log(`找到 ${matchCount} 个匹配`);
    
    // 收集所有高亮元素
    allHighlightedElements = Array.from(document.querySelectorAll('.highlighted-match'));
    console.log(`收集到 ${allHighlightedElements.length} 个高亮元素`);
    
    // 按DOM顺序排序高亮元素
    sortHighlightedElements();
    
    // 更新元素属性，添加序号
    allHighlightedElements.forEach((el, idx) => {
        el.setAttribute('data-match-index', idx + 1);
        el.setAttribute('data-match-total', allHighlightedElements.length);
    });
    
    // 高亮第一个匹配
    if (allHighlightedElements.length > 0) {
        currentHighlightedIndex = 0;
        highlightCurrentMatch();
        
        // 显示结果计数
        showMatchStatus(1, allHighlightedElements.length);
        
        console.log(`高亮第一个匹配，共 ${allHighlightedElements.length} 个`);
    } else {
        console.log('没有找到匹配项');
        showNoMatchesMessage(query);
    }
}

// 高亮下一个匹配
function highlightNextMatch() {
    if (allHighlightedElements.length === 0) {
        return;
    }
    
    // 移到下一个，循环回到开始
    currentHighlightedIndex = (currentHighlightedIndex + 1) % allHighlightedElements.length;
    
    // 高亮当前索引的元素
    highlightCurrentMatch();
    
    // 更新状态显示
    showMatchStatus(currentHighlightedIndex + 1, allHighlightedElements.length);
}

// 高亮当前索引的匹配
function highlightCurrentMatch() {
    // 移除之前的当前高亮
    if (currentHighlightedElement) {
        currentHighlightedElement.classList.remove('current-highlight');
    }
    
    // 设置新的当前高亮
    currentHighlightedElement = allHighlightedElements[currentHighlightedIndex];
    
    if (currentHighlightedElement) {
        // 添加当前高亮样式
        currentHighlightedElement.classList.add('current-highlight');
        
        // 滚动到元素
        currentHighlightedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// 显示匹配状态
function showMatchStatus(current, total) {
    let statusElement = document.getElementById('match-status');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'match-status';
        statusElement.style.position = 'fixed';
        statusElement.style.right = '20px';
        statusElement.style.bottom = '20px';
        statusElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
        statusElement.style.color = 'white';
        statusElement.style.padding = '8px 12px';
        statusElement.style.borderRadius = '4px';
        statusElement.style.zIndex = '1000';
        document.body.appendChild(statusElement);
    }
    
    // 更新状态文本
    statusElement.textContent = `匹配 ${current}/${total}`;
    statusElement.style.display = 'block';
    
    // 自动隐藏状态
    clearTimeout(window.statusTimeout);
    window.statusTimeout = setTimeout(() => {
        statusElement.style.opacity = '0';
        statusElement.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            statusElement.style.display = 'none';
            statusElement.style.opacity = '1';
        }, 500);
    }, 3000);
}

// 清除所有高亮
function clearAllHighlights() {
    // 恢复所有元素的原始内容
    document.querySelectorAll('[data-original-content]').forEach(element => {
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
    });
    
    // 清除状态元素
    const statusElement = document.getElementById('match-status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
    
    // 重置变量
    allHighlightedElements = [];
    currentHighlightedIndex = -1;
    currentHighlightedElement = null;
}

// 按DOM顺序排序高亮元素
function sortHighlightedElements() {
    console.log("排序高亮元素，确保按DOM顺序从上到下排列");
    
    // 记录排序前的顺序，用于调试
    console.log("排序前的顺序:");
    allHighlightedElements.forEach((el, idx) => {
        console.log(`[${idx+1}] 文本="${el.textContent.trim()}"`);
    });
    
    // 按DOM位置排序
    allHighlightedElements.sort((a, b) => {
        // 使用compareDocumentPosition判断节点位置
        const position = a.compareDocumentPosition(b);
        
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
            return -1;  // a在b之前
        } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
            return 1;   // a在b之后
        }
        return 0;       // 相同位置
    });
    
    // 记录排序后的顺序，用于调试
    console.log("排序后的顺序:");
    allHighlightedElements.forEach((el, idx) => {
        console.log(`[${idx+1}] 文本="${el.textContent.trim()}"`);
    });
}

// 初始化搜索功能
function initSearch() {
    console.log("初始化搜索功能");
    
    // 添加搜索样式 - 移除边框效果，只保留背景色
    const style = document.createElement('style');
    style.textContent = `
        .highlighted-match {
            background-color: #fef9c3;
            border-radius: 2px;
        }
        .current-highlight {
            background-color: #fde68a;
        }
        #match-status {
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
    
    // 直接获取桌面和移动搜索框
    const desktopSearch = document.getElementById('desktop-search');
    const mobileSearch = document.getElementById('mobile-search');
    
    console.log("找到搜索框:", {
        desktop: desktopSearch ? "是" : "否",
        mobile: mobileSearch ? "是" : "否"
    });
    
    // 添加桌面搜索事件
    if (desktopSearch) {
        desktopSearch.classList.add('search-ui');
        desktopSearch.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                console.log("桌面搜索框检测到回车键");
                handleSearchInput({
                    target: this,
                    key: 'Enter',
                    preventDefault: () => e.preventDefault()
                });
            }
        });
        
        // 添加清除按钮
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'absolute right-3 top-2.5 text-apple-gray-500 hover:text-apple-gray-700';
        clearBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
        `;
        clearBtn.addEventListener('click', function() {
            desktopSearch.value = '';
            clearAllHighlights();
            desktopSearch.focus();
        });
        
        // 添加到父元素
        if (desktopSearch.parentNode) {
            desktopSearch.parentNode.appendChild(clearBtn);
        }
    }
    
    // 添加移动搜索事件
    if (mobileSearch) {
        mobileSearch.classList.add('search-ui');
        mobileSearch.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                console.log("移动搜索框检测到回车键");
                handleSearchInput({
                    target: this,
                    key: 'Enter',
                    preventDefault: () => e.preventDefault()
                });
            }
        });
        
        // 添加清除按钮
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'absolute right-3 top-2.5 text-apple-gray-500 hover:text-apple-gray-700';
        clearBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
        `;
        clearBtn.addEventListener('click', function() {
            mobileSearch.value = '';
            clearAllHighlights();
            mobileSearch.focus();
        });
        
        // 添加到父元素
        if (mobileSearch.parentNode) {
            mobileSearch.parentNode.appendChild(clearBtn);
        }
    }
    
    // 添加键盘全局事件，支持Esc键清除搜索
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearAllHighlights();
            if (desktopSearch) desktopSearch.value = '';
            if (mobileSearch) mobileSearch.value = '';
        }
    });
    
    console.log("搜索功能初始化完成");
}

// 无匹配时显示提示消息
function showNoMatchesMessage(query) {
    let statusElement = document.getElementById('match-status');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'match-status';
        statusElement.style.position = 'fixed';
        statusElement.style.right = '20px';
        statusElement.style.bottom = '20px';
        statusElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
        statusElement.style.color = 'white';
        statusElement.style.padding = '8px 12px';
        statusElement.style.borderRadius = '4px';
        statusElement.style.zIndex = '1000';
        document.body.appendChild(statusElement);
    }
    
    // 更新状态文本
    statusElement.textContent = `未找到匹配: "${query}"`;
    statusElement.style.display = 'block';
    
    // 自动隐藏状态
    clearTimeout(window.statusTimeout);
    window.statusTimeout = setTimeout(() => {
        statusElement.style.opacity = '0';
        statusElement.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            statusElement.style.display = 'none';
            statusElement.style.opacity = '1';
        }, 500);
    }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initSearch);

// 导出关键函数供其他脚本使用
window.searchFunctions = {
    highlightNextMatch,
    searchAndHighlightAll,
    clearAllHighlights
}; 