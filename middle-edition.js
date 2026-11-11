// The first 51 slides are shared. Each edition has its own closing slide.
(function () {
  'use strict';
  var data = window.EE_DATA;
  var legacy = new URLSearchParams(location.search).get('edition') === '52';
  data.volume = 'middle';
  data.edition = legacy ? '52' : 'R2';
  if (!legacy) {
    data.pageCount = 169;
    data.source = '電力電子初級班講義（中）R2／169 頁';
    data.heroDescription = '依原講義閱讀 DC-DC 電路、驅動與保護、Buck 控制迴路及 Flyback 波形。';
    data.indexNote = 'R2 共 169 頁。P.1–51 與 52 頁版相同，P.52–168 是 R2 新增教材，結語在 P.169。';
    data.readings = window.EE_MIDDLE_R2;
    data.readingSections = [
      [52, 65, 'MOSFET 驅動、切換與緩衝電路'],
      [66, 85, '故障保護與瞬態電壓'],
      [86, 106, 'Buck 元件設計、迴路增益與補償'],
      [107, 120, 'Buck 模擬與掃頻波形'],
      [121, 130, 'PWM 控制器、電流模式與斜率補償'],
      [131, 147, 'Flyback 回授、啟動及待機損耗'],
      [148, 168, '谷底切換、輕載模式與一次側調節']
    ];
    data.slideTitles[169] = data.slideTitles[52];
    window.EE_SOURCE_TEXT[169] = '中冊 R2 結語。上一頁是 Flyback 多模式控制的電壓與電流調節。';
    delete window.EE_SOURCE_TEXT[52];
    Object.keys(data.readings).forEach(function (page) {
      data.slideTitles[page] = data.readings[page].title;
    });
  }
  window.EE_SOURCE_CONFIG.volume = 'middle';
  window.EE_SOURCE_CONFIG.pageCount = data.pageCount;
})();
