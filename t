<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的自选 - GoFin</title>
    <link rel="icon" href="../image/logo2.png" type="image/x-icon">
    <link rel="shortcut icon" href="../image/logo2.png" type="image/x-icon">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#165DFF',
                        secondary: '#0FC6C2',
                        success: '#00B42A',
                        danger: '#F53F3F',
                        warning: '#FF7D00',
                        info: '#86909C',
                        dark: '#1D2129',
                        light: '#F2F3F5'
                    },
                    fontFamily: {
                        inter: ['Inter', 'sans-serif'],
                    },
                },
            }
        }
    </script>

    <style type="text/tailwindcss">
        @layer utilities {
            .content-auto {
                content-visibility: auto;
            }

            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
        }
    </style>
</head>

<body class="bg-light font-inter">
    <!-- 导航栏 -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center space-x-1">
                <img src="../image/logo2.png" alt="GoFin Logo" class="h-10 w-10">
                <h1 class="text-xl font-bold text-primary">GoFin</h1>
            </div>

            <nav class="hidden md:flex items-center space-x-6">
                <a href="index.html" id="nav-home" class="font-medium text-dark hover:text-primary transition-colors">首页</a>
                <a href="favorites.html" id="nav-favorites"
                    class="font-medium text-primary border-b-2 border-primary pb-1">自选</a>
                <a href="dashboard.html" id="nav-dashboard" class="font-medium text-dark hover:text-primary transition-colors">投资组合</a>
            </nav>

            <div class="flex items-center space-x-4">
                <div class="relative hidden md:block">
                    <input type="text" placeholder="搜索股票..."
                        class="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 w-64">
                    <i class="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>

                <button class="md:hidden text-dark text-xl">
                    <i class="fa fa-bars"></i>
                </button>
            </div>
        </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-grow container mx-auto px-4 py-6">
        <div class="flex flex-col md:flex-row gap-6">
            <!-- 左侧：自选股列表 -->
            <div class="md:w-2/3 bg-white rounded-xl shadow-sm p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">我的自选</h2>
                    <button id="createPortfolioBtn" class="bg-primary text-white px-4 py-2 rounded-lg flex items-center">
                        <i class="fa fa-plus-circle mr-2"></i> 创建投资组合
                    </button>
                </div>

                <!-- 自选股表格容器 -->
                <div id="favoritesContainer" class="overflow-y-auto scrollbar-hide max-h-[500px] pr-2">
                    <table class="min-w-full w-full">
                        <thead class="sticky-header border-b border-gray-200">
                            <tr>
                                <th class="py-3 text-left text-sm font-medium text-gray-500 px-2">
                                    <div class="flex items-center">
                                        <input type="checkbox" id="selectAll" class="mr-2">
                                        股票代码
                                    </div>
                                </th>
                                <th class="py-3 text-left text-sm font-medium text-gray-500 px-2">名称</th>
                                <th class="py-3 text-left text-sm font-medium text-gray-500 px-2">价格</th>
                                <th class="py-3 text-left text-sm font-medium text-gray-500 px-2">涨跌幅</th>
                                <th class="py-3 text-left text-sm font-medium text-gray-500 px-2">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- 自选股数据会通过JavaScript动态生成 -->
                        </tbody>
                    </table>
                </div>

                <div class="mt-4 flex justify-between items-center md:hidden">
                    <button id="mobileCreatePortfolioBtn"
                        class="bg-primary text-white px-4 py-2 rounded-lg w-full flex items-center justify-center">
                        <i class="fa fa-plus-circle mr-2"></i> 创建投资组合
                    </button>
                </div>
            </div>

            <!-- 右侧：投资组合 -->
            <div class="md:w-1/3 bg-white rounded-xl shadow-sm p-6">
                <h2 class="text-xl font-bold mb-4">我的投资组合</h2>

                <!-- 投资组合容器 -->
                <div id="portfoliosContainer" class="overflow-y-auto scrollbar-hide max-h-[500px] pr-2">
                    <!-- 投资组合会通过JavaScript动态生成 -->

                    <div class="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-32 hover:bg-gray-50 transition-colors cursor-pointer"
                        id="createNewPortfolio">
                        <i class="fa fa-plus-circle text-gray-400 text-2xl mb-2"></i>
                        <p class="text-gray-500 text-sm">创建新的投资组合</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- 创建投资组合模态框 -->
    <div id="portfolioModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 transform transition-all">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">创建投资组合</h3>
                <button id="closeModal" class="text-gray-400 hover:text-gray-600">
                    <i class="fa fa-times"></i>
                </button>
            </div>

            <form id="portfolioForm">
                <div class="mb-4">
                    <label for="portfolioName" class="block text-sm font-medium text-gray-700 mb-1">组合名称</label>
                    <input type="text" id="portfolioName"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="输入投资组合名称">
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">选择股票</label>
                    <div id="selectedStocks"
                        class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto scrollbar-hide p-2 border border-gray-200 rounded-lg">
                        <!-- 选中的股票会通过JavaScript动态生成 -->
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <p class="text-gray-500 text-sm">比例加总必须等于 100%</p>
                        <p id="totalProportion" class="font-medium text-danger">0%</p>
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" id="cancelPortfolio"
                        class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">取消</button>
                    <button type="submit" class="bg-primary text-white px-4 py-2 rounded-lg">创建组合</button>
                </div>
            </form>
        </div>
    </div>

    <!-- 查看投资组合详情模态框 -->
    <div id="viewPortfolioModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div class="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 class="text-xl font-bold" id="viewPortfolioName">投资组合详情</h3>
                <button id="closeViewModal" class="text-gray-400 hover:text-gray-600">
                    <i class="fa fa-times"></i>
                </button>
            </div>

            <div class="overflow-y-auto p-6">
                <div class="mb-6">
                    <p class="text-gray-500 text-sm mb-4">创建于 <span id="viewPortfolioDate"></span></p>
                    
                    <h4 class="font-medium mb-3">包含股票</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr>
                                    <th class="py-2 px-4 border-b text-left text-sm font-medium text-gray-500">股票代码</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-medium text-gray-500">权重比例</th>
                                </tr>
                            </thead>
                            <tbody id="viewPortfolioStocks">
                                <!-- 股票数据会动态生成 -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="mb-6">
                    <h4 class="font-medium mb-3">近一个月表现</h4>
                    <div class="h-64">
                        <canvas id="portfolioChart"></canvas>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-500 text-sm">总回报率</p>
                        <p class="text-xl font-bold mt-1" id="totalReturn">0%</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-500 text-sm">波动率</p>
                        <p class="text-xl font-bold mt-1" id="volatility">0%</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-500 text-sm">夏普比率</p>
                        <p class="text-xl font-bold mt-1" id="sharpeRatio">0</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-500 text-sm">最大回撤</p>
                        <p class="text-xl font-bold mt-1" id="maxDrawdown">0%</p>
                    </div>
                </div>
            </div>

            <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button id="closeViewPortfolio" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">关闭</button>
                <button id="editFromViewBtn" class="bg-primary text-white px-4 py-2 rounded-lg">编辑组合</button>
            </div>
        </div>
    </div>

    <!-- 编辑投资组合模态框 -->
    <div id="editPortfolioModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 transform transition-all">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">编辑投资组合</h3>
                <button id="closeEditModal" class="text-gray-400 hover:text-gray-600">
                    <i class="fa fa-times"></i>
                </button>
            </div>

            <form id="editPortfolioForm">
                <input type="hidden" id="editPortfolioId">
                <div class="mb-4">
                    <label for="editPortfolioName" class="block text-sm font-medium text-gray-700 mb-1">组合名称</label>
                    <input type="text" id="editPortfolioName"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="输入投资组合名称">
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">选择股票</label>
                    <div id="editSelectedStocks"
                        class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto scrollbar-hide p-2 border border-gray-200 rounded-lg">
                        <!-- 选中的股票会通过JavaScript动态生成 -->
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <p class="text-gray-500 text-sm">比例加总必须等于 100%</p>
                        <p id="editTotalProportion" class="font-medium text-danger">0%</p>
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" id="cancelEditPortfolio"
                        class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">取消</button>
                    <button type="submit" class="bg-primary text-white px-4 py-2 rounded-lg">保存修改</button>
                </div>
            </form>
        </div>
    </div>

    <!-- 删除确认模态框 -->
    <div id="deleteConfirmModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 class="text-xl font-bold mb-4">确认删除</h3>
            <p class="text-gray-600 mb-6">您确定要删除这个投资组合吗？此操作无法撤销。</p>
            <input type="hidden" id="deletePortfolioId">
            <div class="flex justify-end space-x-3">
                <button id="cancelDelete" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">取消</button>
                <button id="confirmDelete" class="bg-danger text-white px-4 py-2 rounded-lg">删除</button>
            </div>
        </div>
    </div>

    <!-- 页脚 -->
    <footer class="bg-white border-t border-gray-200 mt-12">
        <div class="container mx-auto px-4 py-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div class="flex items-center space-x-1 mb-4">
                        <img src="../image/logo2.png" alt="GoFin Logo" class="h-10 w-10">
                        <h3 class="text-lg font-bold text-primary">GoFin</h3>
                    </div>
                    <p class="text-gray-500 text-sm">专业的股票投资组合分析工具，帮助你做出更明智的投资决策。</p>
                </div>

                <div>
                    <h4 class="font-semibold mb-4">产品</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="text-gray-500 hover:text-primary">投资组合分析</a></li>
                        <li><a href="#" class="text-gray-500 hover:text-primary">自选股管理</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-semibold mb-4">关于我们</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="text-gray-500 hover:text-primary">公司介绍</a></li>
                        <li><a href="#" class="text-gray-500 hover:text-primary">团队成员</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-semibold mb-4">联系我们</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="text-gray-500 hover:text-primary">客服邮箱</a></li>
                        <li><a href="#" class="text-gray-500 hover:text-primary">社交媒体</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </footer>

    <script>
        // 模拟自选股数据
        const mockStocks = [
            { symbol: 'AAPL', name: '苹果公司', price: 175.48, change_percent: 0.56, is_favorite: true },
            { symbol: 'MSFT', name: '微软公司', price: 330.12, change_percent: -0.23, is_favorite: true },
            { symbol: 'GOOGL', name: '谷歌公司', price: 125.89, change_percent: 1.23, is_favorite: true },
            { symbol: 'AMZN', name: '亚马逊公司', price: 135.67, change_percent: -0.89, is_favorite: true },
            { symbol: 'TSLA', name: '特斯拉公司', price: 240.25, change_percent: 2.34, is_favorite: true },
            { symbol: 'META', name: '元宇宙公司', price: 320.75, change_percent: -1.23, is_favorite: true },
            { symbol: 'NVDA', name: '英伟达公司', price: 420.50, change_percent: 3.45, is_favorite: true },
            { symbol: 'BABA', name: '阿里巴巴', price: 85.32, change_percent: 0.78, is_favorite: true },
            { symbol: 'PDD', name: '拼多多', price: 145.89, change_percent: -0.45, is_favorite: true },
            { symbol: 'NFLX', name: '奈飞公司', price: 420.12, change_percent: 1.67, is_favorite: true },
        ];

        // 股票行模板
        function createFavoriteRow(stock) {
            const changeClass = stock.change_percent >= 0 ? 'text-success' : 'text-danger';
            const changeIcon = stock.change_percent >= 0 ? 'fa-caret-up' : 'fa-caret-down';

            return `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-2">
                        <div class="flex items-center">
                            <input type="checkbox" class="stock-checkbox mr-2" data-symbol="${stock.symbol}" data-name="${stock.name}">
                            <span class="font-medium">${stock.symbol}</span>
                        </div>
                    </td>
                    <td class="py-3 px-2">${stock.name}</td>
                    <td class="py-3 px-2">¥${stock.price.toFixed(2)}</td>
                    <td class="py-3 px-2 ${changeClass}">
                        <i class="fa ${changeIcon} mr-1"></i> ${Math.abs(stock.change_percent).toFixed(2)}%
                    </td>
                    <td class="py-3 px-2">
                        <button class="text-gray-400 hover:text-danger ml-2 remove-stock" data-symbol="${stock.symbol}">
                            <i class="fa fa-trash"></i>
                        </button> 
                    </td>
                </tr>
            `;
        }

        // 选中的股票标签模板
        function createSelectedStockTag(stock, proportion = '') {
            return `
                <div class="stock-tag flex items-center justify-between bg-blue-50 text-primary px-3 py-2 rounded-lg font-auto" data-symbol="${stock.symbol}" data-name="${stock.name}">
                    <span>${stock.symbol} (${stock.name})</span>
                    <div class="flex items-center ml-2">
                        <input type="number" class="proportion-input ml-1 px-2 py-1 border border-gray-200 rounded-md text-right text-xs w-20" placeholder="权重比例" min="0" max="100" step="0.1" value="${proportion}">
                        <span class="text-xs ml-1">%</span>
                        <button class="ml-1 text-blue-500 hover:text-blue-700 remove-selected">
                            <i class="fa fa-times-circle"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        // 投资组合卡片模板
        function createPortfolioCard(portfolio) {
            // 计算投资组合的涨跌幅（模拟数据）
            const randomChange = (Math.random() * 10 - 5).toFixed(2); // -5% 到 5% 之间的随机数
            const changeClass = randomChange >= 0 ? 'text-success' : 'text-danger';
            const changeIcon = randomChange >= 0 ? 'fa-caret-up' : 'fa-caret-down';

            return `
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer portfolio-card mb-4" data-id="${portfolio.id}">
                    <div class="flex justify-between items-center">
                        <h3 class="font-medium">${portfolio.name}</h3>
                        <div class="${changeClass} flex items-center">
                            <i class="fa ${changeIcon} mr-1"></i> ${randomChange}%
                        </div>
                    </div>
                    <p class="text-gray-500 text-sm mt-2">创建于 ${new Date(portfolio.created_at).toLocaleDateString()}</p>
                    <p class="text-gray-500 text-xs mt-1">包含 ${portfolio.stocks.length} 支股票</p>
                    <div class="flex justify-end mt-4">
                        <button class="text-gray-400 hover:text-danger ml-2 delete-portfolio" data-id="${portfolio.id}">
                            <i class="fa fa-trash"></i>
                        </button>
                        <button class="text-gray-400 hover:text-primary ml-2 edit-portfolio" data-id="${portfolio.id}">
                            <i class="fa fa-pencil"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        // 初始化自选股数据
        function initFavoriteStocks() {
            // 如果localStorage中没有数据，使用模拟数据
            if (!localStorage.getItem('favorites')) {
                localStorage.setItem('favorites', JSON.stringify(mockStocks));
            }
        }

        // 加载自选股数据
        async function loadFavoriteStocks() {
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const tableBody = document.querySelector('tbody');
            tableBody.innerHTML = '';

            if (favorites.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-6 text-center text-gray-500">
                            <div class="mb-2">
                                <i class="fa fa-folder-open-o text-4xl text-gray-300"></i>
                            </div>
                            <p>暂无自选股票</p>
                            <p class="text-sm mt-1">前往首页添加您感兴趣的股票</p>
                        </td>
                    </tr>
                `;
                document.getElementById('createPortfolioBtn').setAttribute('disabled', true);
                document.getElementById('mobileCreatePortfolioBtn').setAttribute('disabled', true);
                return;
            }

            favorites.forEach(stock => {
                tableBody.innerHTML += createFavoriteRow(stock);
            });

            // 添加复选框事件
            document.querySelectorAll('.stock-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateSelectedStocks);
            });

            // 全选复选框事件
            document.getElementById('selectAll').addEventListener('change', function () {
                document.querySelectorAll('.stock-checkbox').forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
                updateSelectedStocks();
            });

            // 添加删除股票事件
            document.querySelectorAll('.remove-stock').forEach(btn => {
                btn.addEventListener('click', function () {
                    const symbol = this.dataset.symbol;
                    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                    favorites = favorites.filter(stock => stock.symbol !== symbol);
                    localStorage.setItem('favorites', JSON.stringify(favorites));
                    loadFavoriteStocks();
                });
            });

            // 启用创建投资组合按钮
            document.getElementById('createPortfolioBtn').removeAttribute('disabled');
            document.getElementById('mobileCreatePortfolioBtn').removeAttribute('disabled');
        }

        // 加载投资组合数据
        async function loadPortfolios() {
            try {
                const response = await fetch('/api/portfolio/all');
                const portfolios = await response.json();
                const container = document.getElementById('portfoliosContainer');

                // 清空容器，保留"创建新投资组合"卡片
                const createNewCard = document.getElementById('createNewPortfolio');
                container.innerHTML = '';
                container.appendChild(createNewCard);

                if (portfolios.length === 0) {
                    return;
                }

                // 添加投资组合卡片到容器，放在"创建新投资组合"卡片之前
                portfolios.forEach(portfolio => {
                    const portfolioCard = document.createElement('div');
                    portfolioCard.innerHTML = createPortfolioCard(portfolio);
                    container.insertBefore(portfolioCard.firstElementChild, createNewCard);
                });

                // 添加删除投资组合事件
                document.querySelectorAll('.delete-portfolio').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation(); // 阻止事件冒泡到卡片点击事件
                        const id = this.dataset.id;
                        openDeleteConfirmModal(id);
                    });
                });

                // 添加编辑投资组合事件
                document.querySelectorAll('.edit-portfolio').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation(); // 阻止事件冒泡到卡片点击事件
                        const id = this.dataset.id;
                        openEditPortfolioModal(id);
                    });
                });

                // 添加查看投资组合详情事件
                document.querySelectorAll('.portfolio-card').forEach(card => {
                    card.addEventListener('click', function () {
                        const id = this.dataset.id;
                        viewPortfolio(id);
                    });
                });
            } catch (error) {
                console.error('加载投资组合数据出错:', error);
                alert('加载投资组合失败，请刷新页面重试');
            }
        }

        // 打开创建投资组合模态框
        function openPortfolioModal() {
            const modal = document.getElementById('portfolioModal');
            modal.classList.remove('hidden');

            // 初始化选中的股票
            updateSelectedStocks();
        }

        // 关闭创建投资组合模态框
        function closePortfolioModal() {
            const modal = document.getElementById('portfolioModal');
            modal.classList.add('hidden');

            // 重置表单
            document.getElementById('portfolioForm').reset();
            document.getElementById('selectedStocks').innerHTML = '<p class="text-gray-400 text-sm w-full text-center">未选择任何股票</p>';
            updateTotalProportion(); // 重置总比例显示
        }

        // 提交创建投资组合表单
        async function submitPortfolioForm(e) {
            e.preventDefault();

            const portfolioName = document.getElementById('portfolioName').value.trim();
            if (!portfolioName) {
                alert('请输入投资组合名称');
                return;
            }

            const selectedSymbols = Array.from(document.querySelectorAll('.stock-checkbox:checked'))
               .map(checkbox => checkbox.dataset.symbol);

            if (selectedSymbols.length === 0) {
                alert('请至少选择一支股票');
                return;
            }

            // 计算总比例
            const totalProportion = updateTotalProportion();

            // 严格检查总比例是否为100%
            if (Math.abs(totalProportion - 100) > 0.1) {
                alert('股票比例加总必须严格等于100%，请调整后再试');
                return;
            }

            // 收集比例数据
            const proportions = {};
            const selectedStockElements = document.querySelectorAll('#selectedStocks [data-symbol]');
            selectedStockElements.forEach(element => {
                const symbol = element.dataset.symbol;
                const input = element.querySelector('input[type="number"]');
                const proportion = parseFloat(input.value) || 0;
                proportions[symbol] = parseFloat(proportion.toFixed(2)); // 保留两位小数
            });

            // 创建投资组合对象
            const portfolio = {
                name: portfolioName,
                stocks: selectedSymbols.map(symbol => ({
                    symbol,
                    proportion: proportions[symbol]
                }))
            };

            try {
                const response = await fetch('/api/portfolio/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(portfolio)
                });

                if (response.ok) {
                    alert('投资组合创建成功');
                    closePortfolioModal();
                    loadPortfolios(); // 更新投资组合列表
                } else {
                    const errorData = await response.json();
                    alert('创建投资组合失败: ' + errorData.error);
                }
            } catch (error) {
                console.error('创建投资组合出错:', error);
                alert('创建投资组合出错，请稍后再试');
            }
        }

        // 打开查看投资组合模态框
        async function viewPortfolio(id) {
            try {
                const response = await fetch(`/api/portfolio/${id}`);
                const portfolio = await response.json();

                // 填充基本信息
                document.getElementById('viewPortfolioName').textContent = portfolio.name;
                document.getElementById('viewPortfolioDate').textContent = new Date(portfolio.created_at).toLocaleDateString();
                
                // 填充股票列表
                const stocksContainer = document.getElementById('viewPortfolioStocks');
                stocksContainer.innerHTML = '';
                portfolio.stocks.forEach(stock => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="py-2 px-4 border-b">${stock.stock_symbol}</td>
                        <td class="py-2 px-4 border-b">${stock.proportion}%</td>
                    `;
                    stocksContainer.appendChild(row);
                });
                
                // 填充指标数据
                if (portfolio.performance && portfolio.performance.metrics) {
                    document.getElementById('totalReturn').textContent = portfolio.performance.metrics.totalReturn;
                    document.getElementById('volatility').textContent = portfolio.performance.metrics.volatility;
                    document.getElementById('sharpeRatio').textContent = portfolio.performance.metrics.sharpe;
                    document.getElementById('maxDrawdown').textContent = portfolio.performance.metrics.maxDrawdown;
                    
                    // 设置图表
                    const ctx = document.getElementById('portfolioChart').getContext('2d');
                    if (window.portfolioChartInstance) {
                        window.portfolioChartInstance.destroy();
                    }
                    
                    window.portfolioChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: portfolio.performance.dates,
                            datasets: [{
                                label: portfolio.name,
                                data: portfolio.performance.values,
                                borderColor: '#165DFF',
                                backgroundColor: 'rgba(22, 93, 255, 0.1)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            },
                            scales: {
                                x: {
                                    ticks: {
                                        maxRotation: 0,
                                        autoSkip: true,
                                        maxTicksLimit: 6
                                    }
                                }
                            }
                        }
                    });
                } else {
                    // 如果没有性能数据
                    document.getElementById('totalReturn').textContent = 'N/A';
                    document.getElementById('volatility').textContent = 'N/A';
                    document.getElementById('sharpeRatio').textContent = 'N/A';
                    document.getElementById('maxDrawdown').textContent = 'N/A';
                    
                    // 清空图表
                    const ctx = document.getElementById('portfolioChart').getContext('2d');
                    if (window.portfolioChartInstance) {
                        window.portfolioChartInstance.destroy();
                    }
                    const chart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: [],
                            datasets: []
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    enabled: false
                                }
                            }
                        }
                    });
                }
                
                // 保存当前查看的投资组合ID，用于从查看模态框直接编辑
                document.getElementById('editFromViewBtn').dataset.id = id;
                
                // 显示模态框
                document.getElementById('viewPortfolioModal').classList.remove('hidden');
            } catch (error) {
                console.error('查看投资组合出错:', error);
                alert('查看投资组合失败，请重试');
            }
        }

        // 关闭查看投资组合模态框
        function closeViewPortfolioModal() {
            document.getElementById('viewPortfolioModal').classList.add('hidden');
        }

        // 打开编辑投资组合模态框
        async function openEditPortfolioModal(id) {
            try {
                const response = await fetch(`/api/portfolio/${id}`);
                const portfolio = await response.json();

                const modal = document.getElementById('editPortfolioModal');
                modal.classList.remove('hidden');

                document.getElementById('editPortfolioId').value = portfolio.id;
                document.getElementById('editPortfolioName').value = portfolio.name;

                const editSelectedStocksContainer = document.getElementById('editSelectedStocks');
                editSelectedStocksContainer.innerHTML = '';

                // 获取所有自选股
                const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                
                // 添加当前投资组合中的股票
                portfolio.stocks.forEach(stock => {
                    // 找到股票的完整信息
                    const stockInfo = favorites.find(fav => fav.symbol === stock.stock_symbol) || {
                        symbol: stock.stock_symbol,
                        name: stock.stock_symbol
                    };
                    
                    const stockTag = createSelectedStockTag(stockInfo, stock.proportion);
                    const stockElement = document.createElement('div');
                    stockElement.innerHTML = stockTag;
                    editSelectedStocksContainer.appendChild(stockElement.firstElementChild);
                });

                // 添加比例输入事件监听，实时更新总比例
                editSelectedStocksContainer.querySelectorAll('input[type="number"]').forEach(input => {
                    input.addEventListener('input', updateEditTotalProportion);
                    input.addEventListener('change', updateEditTotalProportion);
                });

                // 添加删除选中股票事件
                editSelectedStocksContainer.querySelectorAll('.remove-selected').forEach(btn => {
                    btn.addEventListener('click', function () {
                        this.closest('.stock-tag').remove();
                        updateEditTotalProportion();
                    });
                });

                // 阻止比例输入框的回车事件冒泡
                editSelectedStocksContainer.querySelectorAll('input[type="number"]').forEach(input => {
                    input.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                        }
                    });
                });

                updateEditTotalProportion(); // 初始化总比例显示
            } catch (error) {
                console.error('加载投资组合数据出错:', error);
                alert('加载投资组合数据出错，请稍后再试');
            }
        }

        // 关闭编辑投资组合模态框
        function closeEditPortfolioModal() {
            const modal = document.getElementById('editPortfolioModal');
            modal.classList.add('hidden');
        }

        // 提交编辑投资组合表单
        async function submitEditPortfolioForm(e) {
            e.preventDefault();

            const portfolioId = document.getElementById('editPortfolioId').value;
            const portfolioName = document.getElementById('editPortfolioName').value.trim();
            if (!portfolioName) {
                alert('请输入投资组合名称');
                return;
            }

            const selectedStockElements = document.querySelectorAll('#editSelectedStocks [data-symbol]');
            if (selectedStockElements.length === 0) {
                alert('请至少选择一支股票');
                return;
            }

            // 计算总比例
            const totalProportion = updateEditTotalProportion();

            // 严格检查总比例是否为100%
            if (Math.abs(totalProportion - 100) > 0.1) {
                alert('股票比例加总必须严格等于100%，请调整后再试');
                return;
            }

            // 收集比例数据
            const stocks = [];
            selectedStockElements.forEach(element => {
                const symbol = element.dataset.symbol;
                const input = element.querySelector('input[type="number"]');
                const proportion = parseFloat(input.value) || 0;
                stocks.push({
                    symbol,
                    proportion: parseFloat(proportion.toFixed(2)) // 保留两位小数
                });
            });

            // 更新投资组合对象
            const portfolio = {
                name: portfolioName,
                stocks
            };

            try {
                const response = await fetch(`/api/portfolio/${portfolioId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(portfolio)
                });

                if (response.ok) {
                    alert('投资组合修改成功');
                    closeEditPortfolioModal();
                    loadPortfolios(); // 更新投资组合列表
                } else {
                    const errorData = await response.json();
                    alert('修改投资组合失败: ' + errorData.error);
                }
            } catch (error) {
                console.error('修改投资组合出错:', error);
                alert('修改投资组合出错，请稍后再试');
            }
        }

        // 打开删除确认模态框
        function openDeleteConfirmModal(id) {
            document.getElementById('deletePortfolioId').value = id;
            document.getElementById('deleteConfirmModal').classList.remove('hidden');
        }

        // 关闭删除确认模态框
        function closeDeleteConfirmModal() {
            document.getElementById('deleteConfirmModal').classList.add('hidden');
        }

        // 确认删除投资组合
        async function confirmDeletePortfolio() {
            const portfolioId = document.getElementById('deletePortfolioId').value;
            
            try {
                const response = await fetch(`/api/portfolio/${portfolioId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    closeDeleteConfirmModal();
                    loadPortfolios(); // 更新投资组合列表
                    alert('投资组合已成功删除');
                } else {
                    const errorData = await response.json();
                    alert('删除投资组合失败: ' + errorData.error);
                }
            } catch (error) {
                console.error('删除投资组合出错:', error);
                alert('删除投资组合出错，请稍后再试');
            }
        }

        // 计算并更新总比例显示
        function updateTotalProportion() {
            const inputs = document.querySelectorAll('#selectedStocks input[type="number"]');
            let total = 0;

            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                total += value;
            });

            const totalElement = document.getElementById('totalProportion');
            totalElement.textContent = `${total.toFixed(1)}%`;

            // 根据总比例设置颜色
            if (Math.abs(total - 100) < 0.1) {
                totalElement.className = 'font-medium text-success';
            } else {
                totalElement.className = 'font-medium text-danger';
            }

            return total;
        }

        // 计算并更新编辑模态框的总比例显示
        function updateEditTotalProportion() {
            const inputs = document.querySelectorAll('#editSelectedStocks input[type="number"]');
            let total = 0;

            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                total += value;
            });

            const totalElement = document.getElementById('editTotalProportion');
            totalElement.textContent = `${total.toFixed(1)}%`;

            // 根据总比例设置颜色
            if (Math.abs(total - 100) < 0.1) {
                totalElement.className = 'font-medium text-success';
            } else {
                totalElement.className = 'font-medium text-danger';
            }

            return total;
        }

        // 更新选中的股票
        function updateSelectedStocks() {
            const selectedCheckboxes = document.querySelectorAll('.stock-checkbox:checked');
            const selectedStocksContainer = document.getElementById('selectedStocks');
            selectedStocksContainer.innerHTML = '';

            if (selectedCheckboxes.length === 0) {
                selectedStocksContainer.innerHTML = '<p class="text-gray-400 text-sm w-full text-center">未选择任何股票</p>';
            } else {
                // 平均分配比例
                const equalProportion = (100 / selectedCheckboxes.length).toFixed(1);
                
                selectedCheckboxes.forEach(checkbox => {
                    const stock = {
                        symbol: checkbox.dataset.symbol,
                        name: checkbox.dataset.name
                    };
                    const stockTag = createSelectedStockTag(stock, equalProportion);
                    const stockElement = document.createElement('div');
                    stockElement.innerHTML = stockTag;
                    selectedStocksContainer.appendChild(stockElement.firstElementChild);
                });

                // 添加删除选中股票事件
                document.querySelectorAll('.remove-selected').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const symbol = this.closest('.stock-tag').dataset.symbol;
                        const checkbox = document.querySelector(`.stock-checkbox[data-symbol="${symbol}"]`);
                        checkbox.checked = false;
                        updateSelectedStocks();
                    });
                });

                // 添加比例输入事件监听，实时更新总比例
                document.querySelectorAll('#selectedStocks input[type="number"]').forEach(input => {
                    input.addEventListener('input', updateTotalProportion);
                    input.addEventListener('change', updateTotalProportion);
                });

                // 阻止比例输入框的回车事件冒泡
                document.querySelectorAll('#selectedStocks input[type="number"]').forEach(input => {
                    input.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                        }
                    });
                });

                updateTotalProportion();
            }
        }

        // 页面加载完成后执行
        document.addEventListener('DOMContentLoaded', () => {
            initFavoriteStocks();
            loadFavoriteStocks();
            loadPortfolios();

            // 绑定创建投资组合按钮事件
            document.getElementById('createPortfolioBtn').addEventListener('click', openPortfolioModal);
            document.getElementById('mobileCreatePortfolioBtn').addEventListener('click', openPortfolioModal);
            document.getElementById('createNewPortfolio').addEventListener('click', openPortfolioModal);

            // 绑定模态框关闭事件
            document.getElementById('closeModal').addEventListener('click', closePortfolioModal);
            document.getElementById('cancelPortfolio').addEventListener('click', closePortfolioModal);

            // 点击模态框外部关闭
            document.getElementById('portfolioModal').addEventListener('click', function (e) {
                if (e.target === this) {
                    closePortfolioModal();
                }
            });

            // 绑定表单提交事件
            document.getElementById('portfolioForm').addEventListener('submit', submitPortfolioForm);

            // 绑定查看模态框关闭事件
            document.getElementById('closeViewModal').addEventListener('click', closeViewPortfolioModal);
            document.getElementById('closeViewPortfolio').addEventListener('click', closeViewPortfolioModal);

            // 从查看模态框打开编辑
            document.getElementById('editFromViewBtn').addEventListener('click', function () {
                const id = this.dataset.id;
                closeViewPortfolioModal();
                openEditPortfolioModal(id);
            });

            // 点击查看模态框外部关闭
            document.getElementById('viewPortfolioModal').addEventListener('click', function (e) {
                if (e.target === this) {
                    closeViewPortfolioModal();
                }
            });

            // 绑定编辑模态框关闭事件
            document.getElementById('closeEditModal').addEventListener('click', closeEditPortfolioModal);
            document.getElementById('cancelEditPortfolio').addEventListener('click', closeEditPortfolioModal);

            // 点击编辑模态框外部关闭
            document.getElementById('editPortfolioModal').addEventListener('click', function (e) {
                if (e.target === this) {
                    closeEditPortfolioModal();
                }
            });

            // 绑定编辑表单提交事件
            document.getElementById('editPortfolioForm').addEventListener('submit', submitEditPortfolioForm);

            // 绑定删除确认事件
            document.getElementById('confirmDelete').addEventListener('click', confirmDeletePortfolio);
            document.getElementById('cancelDelete').addEventListener('click', closeDeleteConfirmModal);

            // 点击删除模态框外部关闭
            document.getElementById('deleteConfirmModal').addEventListener('click', function (e) {
                if (e.target === this) {
                    closeDeleteConfirmModal();
                }
            });

            // 监听 storage 事件，当 localStorage 变化时更新页面
            window.addEventListener('storage', () => {
                loadFavoriteStocks();
            });
        });
    </script>
</body>

</html>
