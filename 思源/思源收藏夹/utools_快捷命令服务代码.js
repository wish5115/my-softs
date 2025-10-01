const main = async () => {
  switch (action) {
    // 存储本次网址信息
    // curl "http://127.0.0.1:33442/?action=setWebInfo&content="
    case 'setWebInfo':
      quickcommand.userData.put(content, "content", true);
      console.log('ok');
      break;
    // 获取上次网址信息
    // curl "http://127.0.0.1:33442/?action=getWebInfo&content="
    case 'getWebInfo':
      console.log(quickcommand.userData.get("content") || '');
      break;
    // 代理请求（支持跨域）
    // curl "http://127.0.0.1:33442/?action=proxyRequest&url=&options={}"
    case 'proxyRequest':
      let opts = {};
      if (typeof options !== 'undefined') {
        opts = JSON.parse(decodeURIComponent(options || '') || '{}');
      }
      const response = await axios.get(url, opts);
      console.log(response.data || '');

      // const response = await fetch(url, opts);
      // const text = await response.text();
      // console.log(text);
      break;
    // 健康状态
    // curl "http://127.0.0.1:33442/?action=healthStatus"
    case 'healthStatus':
      console.log('ok');
      break;
    default:
      break
  }
};
main();