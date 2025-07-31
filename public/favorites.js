
const mockStocks = [
    { symbol: 'AAPL', name: '苹果公司', price: 175.48, change_percent: 0.56, is_favorite: true },
    { symbol: 'MSFT', name: '微软公司', price: 330.12, change_percent: -0.23, is_favorite: true },
    { symbol: 'GOOGL', name: '谷歌公司', price: 125.89, change_percent: 1.23, is_favorite: true },
];

// 股票行模板
function createFavoriteRow(stock) {
    const changeClass = stock.change_percent >= 0 ? 'text-success' : 'text-danger';
    const changeIcon = stock.change_percent >= 0 ? 'fa-caret-up' : 'fa-caret-down';

    return `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-2">
                        <div class="flex items-center">
                            <input type="checkbox" class="stock-checkbox mr-2" data-symbol="${stock.symbol}">
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
function createSelectedStockTag(stock) {
    return `
                <div class="stock-tag flex items-center justify-between bg-blue-50 text-primary px-3 py-2 rounded-lg font-auto" data-symbol="${stock.symbol}">
                    <span>${stock.symbol}</span>
                    <div class="flex items-center ml-2">
                        <input type="number" class="proportion-input ml-1 px-2 py-1 border border-gray-200 rounded-md text-right text-xs w-20" placeholder="权重比例" min="0" max="100" step="0.1">
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
    // 获取所有自选股数据用于匹配股票名称
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // 计算投资组合的涨跌幅（模拟数据）
    const randomChange = (Math.random() * 10 - 5).toFixed(2);
    const changeClass = randomChange >= 0 ? 'text-success' : 'text-danger';
    const changeIcon = randomChange >= 0 ? 'fa-caret-up' : 'fa-caret-down';

    return `
        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer portfolio-card" data-id="${portfolio.id}">
          <div class="flex justify-between items-center">
            <h3 class="font-medium">${portfolio.name}</h3>
            <span class="${changeClass} text-sm flex items-center">
              <i class="fa ${changeIcon} mr-1"></i> ${Math.abs(randomChange)}%
            </span>
          </div>
          <p class="text-gray-500 text-sm mt-1">包含 ${portfolio.stocks.length} 支股票</p>
          <div class="mt-3 flex flex-wrap gap-2">
            ${portfolio.stocks.map(stock => {
                // 从接口数据中获取正确的股票代码（stock_symbol字段）
                const symbol = stock.stock_symbol;
                // 从自选股中匹配股票名称，未找到则显示代码
                const stockData = favorites.find(fav => fav.symbol === symbol) || { name: symbol };
                return `<span class="bg-blue-50 text-primary text-xs px-2 py-1 rounded-full" title="${stockData.name}">${symbol}</span>`;
            }).join('')}
          </div>
          <div class="mt-3 flex justify-end">
            <button class="text-gray-400 hover:text-danger text-sm delete-portfolio" data-id="${portfolio.id}">
              <i class="fa fa-trash mr-1"></i> 删除
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
        updateScrollIndicator('favorites');
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

    // 添加移除收藏事件
    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', function () {
            const symbol = this.dataset.symbol;
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            favorites = favorites.filter(stock => stock.symbol !== symbol);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            loadFavoriteStocks();
            loadPortfolios(); // 更新投资组合显示
        });
    });

    // 添加删除股票事件
    document.querySelectorAll('.remove-stock').forEach(btn => {
        btn.addEventListener('click', function () {
            const symbol = this.dataset.symbol;
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            favorites = favorites.filter(stock => stock.symbol !== symbol);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            loadFavoriteStocks();
            loadPortfolios(); // 更新投资组合显示
        });
    });

    // 启用创建投资组合按钮
    document.getElementById('createPortfolioBtn').removeAttribute('disabled');
    document.getElementById('mobileCreatePortfolioBtn').removeAttribute('disabled');

    // 更新滚动指示器
    updateScrollIndicator('favorites');
}

// 加载投资组合数据
// 加载投资组合数据
async function loadPortfolios() {
    try {
        const response = await fetch('/api/portfolio/all');
        const portfolios = await response.json();
        const container = document.getElementById('portfoliosContainer');
        const createNewCard = document.getElementById('createNewPortfolio');

        // 清空容器
        container.innerHTML = '';

        // 如果没有投资组合，显示"创建新投资组合"卡片
        if (portfolios.length === 0) {
            if (createNewCard) {
                container.appendChild(createNewCard);
            }
            updateScrollIndicator('portfolios');
            return;
        }

        // 有投资组合时，只显示投资组合卡片（不显示创建新组合卡片）
        portfolios.forEach(portfolio => {
            const portfolioCard = document.createElement('div');
            portfolioCard.innerHTML = createPortfolioCard(portfolio);
            container.appendChild(portfolioCard.firstElementChild);
        });

        // 添加删除投资组合事件
        document.querySelectorAll('.delete-portfolio').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation(); // 阻止事件冒泡到卡片点击事件
                const id = this.dataset.id;
                deletePortfolio(id);
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
                openEditPortfolioModal(id);
            });
        });

        // 更新滚动指示器
        updateScrollIndicator('portfolios');
    } catch (error) {
        console.error('加载投资组合数据出错:', error);
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
        const response = await fetch('http://localhost:3001/api/portfolio/create', {
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

// 打开编辑投资组合模态框
// 修正编辑投资组合模态框中的股票数据处理
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

        // 获取所有自选股数据用于匹配股票名称
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        portfolio.stocks.forEach(stock => {
            const stockData = {
                symbol: stock.stock_symbol,
                // 尝试从自选股中获取股票名称
                name: favorites.find(fav => fav.symbol === stock.stock_symbol)?.name || stock.stock_symbol
            };
            
            const stockTag = createSelectedStockTag(stockData);
            const stockElement = document.createElement('div');
            stockElement.innerHTML = stockTag;
            const input = stockElement.querySelector('input[type="number"]');
            input.value = parseFloat(stock.proportion);
            
            editSelectedStocksContainer.appendChild(stockElement.firstElementChild);
        });

        // 添加比例输入事件监听
        editSelectedStocksContainer.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', updateEditTotalProportion);
            input.addEventListener('change', updateEditTotalProportion);
        });

        updateEditTotalProportion();
    } catch (error) {
        console.error('加载投资组合数据出错:', error);
        alert('加载投资组合数据出错，请稍后再试');
    }
}

// 关闭编辑投资组合模态框
function closeEditPortfolioModal() {
    const modal = document.getElementById('editPortfolioModal');
    modal.classList.add('hidden');

    // 重置表单
    document.getElementById('editPortfolioForm').reset();
    document.getElementById('editSelectedStocks').innerHTML = '<p class="text-gray-400 text-sm w-full text-center">未选择任何股票</p>';
    updateEditTotalProportion(); // 重置总比例显示
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
    const proportions = {};
    selectedStockElements.forEach(element => {
        const symbol = element.dataset.symbol;
        const input = element.querySelector('input[type="number"]');
        const proportion = parseFloat(input.value) || 0;
        proportions[symbol] = parseFloat(proportion.toFixed(2)); // 保留两位小数
    });

    // 更新投资组合对象
    const portfolio = {
        id: portfolioId,
        name: portfolioName,
        stocks: Object.keys(proportions).map(symbol => ({
            stock_symbol: symbol,
            proportion: proportions[symbol]
        }))
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

// 更新滚动指示器
function updateScrollIndicator(type) {
    const container = document.getElementById(`${type}Container`);
    const handle = document.getElementById(`${type}ScrollHandle`);
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollTop = container.scrollTop;

    if (scrollHeight > clientHeight) {
        const ratio = scrollTop / (scrollHeight - clientHeight);
        handle.style.transform = `translateY(${ratio * (clientHeight - handle.offsetHeight)}px)`;
    }
}

// 删除投资组合
async function deletePortfolio(id) {
    if (confirm('确定要删除这个投资组合吗？')) {
        try {
            const response = await fetch(`/api/portfolio/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadPortfolios();
            } else {
                const errorData = await response.json();
                alert('删除投资组合失败: ' + errorData.error);
            }
        } catch (error) {
            console.error('删除投资组合出错:', error);
            alert('删除投资组合出错，请稍后再试');
        }
    }
}

// 查看投资组合详情
function viewPortfolio(id) {
    alert(`查看投资组合 #${id} 的详情`);
}

// 更新选中的股票
function updateSelectedStocks() {
    const selectedSymbols = Array.from(document.querySelectorAll('.stock-checkbox:checked'))
        .map(checkbox => checkbox.dataset.symbol);

    const selectedStocksContainer = document.getElementById('selectedStocks');
    selectedStocksContainer.innerHTML = '';

    if (selectedSymbols.length === 0) {
        selectedStocksContainer.innerHTML = '<p class="text-gray-400 text-sm w-full text-center">未选择任何股票</p>';
    } else {
        selectedSymbols.forEach(symbol => {
            const stock = { symbol };
            const stockTag = createSelectedStockTag(stock);
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

    // 监听 storage 事件，当 localStorage 变化时更新页面
    window.addEventListener('storage', () => {
        loadFavoriteStocks();
        loadPortfolios();
    });
});