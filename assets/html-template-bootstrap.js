// 简化的 html-template-bootstrap，直接内联 React 和 ReactDOM
// 用于 GitHub Pages 部署

(function() {
  'use strict';

  // 从 CDN 加载 React 和 ReactDOM
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // 加载 React 和 ReactDOM
  Promise.all([
    loadScript('https://unpkg.com/react@18/umd/react.production.min.js'),
    loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js')
  ]).then(() => {
    // 等待 Ant Design 加载（如果页面中有）
    const waitForAntd = () => {
      return new Promise((resolve) => {
        if (window.antd) {
          resolve(window.antd);
        } else {
          // 尝试加载 Ant Design
          loadScript('https://unpkg.com/antd@5/dist/antd.min.js')
            .then(() => resolve(window.antd))
            .catch(() => resolve(null));
        }
      });
    };

    waitForAntd().then(() => {
      // 渲染组件
      window.HtmlTemplateBootstrap = {
        renderComponent: function(Component, props) {
          const root = document.getElementById('root');
          if (!root) {
            console.error('[Html Template] 找不到 #root 元素');
            return;
          }

          const containerProps = props || {
            container: root,
            config: {},
            data: {},
            events: {}
          };

          try {
            const element = React.createElement(Component, containerProps);
            const rootElement = ReactDOM.createRoot(root);
            rootElement.render(element);
          } catch (error) {
            console.error('[Html Template] 渲染失败:', error);
          }
        },
        React: window.React,
        ReactDOM: window.ReactDOM
      };

      // 触发 ready 事件
      window.dispatchEvent(new Event('htmlTemplateBootstrapReady'));
    });
  }).catch(error => {
    console.error('[Html Template] 加载 React 失败:', error);
  });
})();
