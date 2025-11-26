/**
 * 图片查看器库 - ImageViewer
 * 纯JavaScript实现，无依赖
 *  version 1.0.0
 */
class ImageViewer {
  constructor(options = {}) {
    this.options = {
      maxZoom: 5,
      minZoom: 0.5,
      zoomStep: 0.1,
      ...options
    };
    
    this.isOpen = false;
    this.currentScale = 1;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.translateX = 0;
    this.translateY = 0;
    
    this.init();
  }
  
  /**
   * 初始化DOM结构
   */
  init() {
    // 创建查看器容器
    this.overlay = document.createElement('div');
    this.overlay.className = 'image-viewer-overlay';
    this.overlay.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      cursor: zoom-out;
    `;
    
    // 创建关闭按钮
    this.closeBtn = document.createElement('button');
    this.closeBtn.innerHTML = '&times;';
    this.closeBtn.className = 'image-viewer-close';
    this.closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 40px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.3s;
      z-index: 10001;
      line-height: 1;
      padding: 0;
    `;
    
    // 创建图片容器
    this.imageContainer = document.createElement('div');
    this.imageContainer.className = 'image-viewer-container';
    this.imageContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      cursor: grab;
      transition: transform 0.3s ease;
    `;
    
    // 创建图片元素
    this.image = document.createElement('img');
    this.image.className = 'image-viewer-image';
    this.image.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      display: block;
      user-select: none;
      -webkit-user-drag: none;
    `;
    
    // 组装DOM
    this.imageContainer.appendChild(this.image);
    this.overlay.appendChild(this.closeBtn);
    this.overlay.appendChild(this.imageContainer);
    document.body.appendChild(this.overlay);
    
    // 绑定事件
    this.bindEvents();
  }
  
  /**
   * 绑定所有事件
   */
  bindEvents() {
    // 关闭按钮点击
    this.closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    
    // 点击遮罩层关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    // ESC键关闭
    this.keydownHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
    
    // 鼠标滚轮缩放
    this.wheelHandler = (e) => {
      if (!this.isOpen) return;
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -1 : 1;
      const newScale = this.currentScale + (delta * this.options.zoomStep);
      
      if (newScale >= this.options.minZoom && newScale <= this.options.maxZoom) {
        this.currentScale = newScale;
        this.updateTransform();
      }
    };
    this.overlay.addEventListener('wheel', this.wheelHandler, { passive: false });
    
    // 鼠标拖拽
    this.imageContainer.addEventListener('mousedown', (e) => {
      if (this.currentScale <= 1) return;
      
      e.preventDefault();
      this.isDragging = true;
      this.startX = e.clientX - this.translateX;
      this.startY = e.clientY - this.translateY;
      this.imageContainer.style.cursor = 'grabbing';
      this.imageContainer.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      e.preventDefault();
      this.translateX = e.clientX - this.startX;
      this.translateY = e.clientY - this.startY;
      this.updateTransform();
    });
    
    document.addEventListener('mouseup', () => {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      this.imageContainer.style.cursor = 'grab';
    });
    
    // 防止图片拖拽
    this.image.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
    
    // 关闭按钮悬停效果
    this.closeBtn.addEventListener('mouseenter', () => {
      this.closeBtn.style.background = 'rgba(255, 255, 255, 0.4)';
    });
    
    this.closeBtn.addEventListener('mouseleave', () => {
      this.closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
  }
  
  /**
   * 更新图片变换
   */
  updateTransform() {
    this.imageContainer.style.transform = `
      translate(calc(-50% + ${this.translateX}px), calc(-50% + ${this.translateY}px))
    `;
    this.image.style.transform = `scale(${this.currentScale})`;
  }
  
  /**
   * 打开图片查看器
   * @param {string} src - 图片URL
   */
  open(src) {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.image.src = src;
    this.overlay.style.display = 'block';
    
    // 防止背景滚动
    document.body.style.overflow = 'hidden';
    
    // 重置状态
    this.currentScale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
    
    // 添加淡入动画
    setTimeout(() => {
      this.overlay.style.opacity = '1';
    }, 10);
  }
  
  /**
   * 关闭图片查看器
   */
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.overlay.style.display = 'none';
    this.overlay.style.opacity = '0';
    
    // 恢复背景滚动
    document.body.style.overflow = '';
  }
  
  /**
   * 销毁查看器
   */
  destroy() {
    this.close();
    document.removeEventListener('keydown', this.keydownHandler);
    this.overlay.remove();
  }
}

/**
 * 便捷方法：为所有图片添加点击查看功能
 * @param {string} selector - 图片选择器
 */
ImageViewer.bindImages = function(selector = 'img[data-viewer]') {
  const viewer = new ImageViewer();
  
  document.addEventListener('click', (e) => {
    const target = e.target.closest(selector);
    if (target && target.tagName === 'IMG') {
      e.preventDefault();
      viewer.open(target.src);
    }
  });
  
  return viewer;
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageViewer;
} else {
  window.ImageViewer = ImageViewer;
}