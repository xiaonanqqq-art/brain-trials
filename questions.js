(function (root, factory) {
  'use strict';
  const bank = factory();
  if (typeof module === 'object' && module.exports) module.exports = bank;
  root.BrainQuestions = bank;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const colors = { orange: '#ff8b57', mint: '#81d8b5', purple: '#a39af5' };
  const categories = {
    number: { name: '数字规律', icon: '∑' },
    pattern: { name: '图形推理', icon: '◈' },
    logic: { name: '逻辑判断', icon: '⌘' },
    memory: { name: '记忆挑战', icon: '▦' },
    spatial: { name: '空间想象', icon: '◇' }
  };
  const chapters = [
    { name: '初露锋芒', subtitle: '入门 · 找到思考的节奏', color: colors.orange },
    { name: '思维跃迁', subtitle: '进阶 · 看见隐藏的联系', color: colors.mint },
    { name: '突破边界', subtitle: '挑战 · 多想一步，答案就在眼前', color: colors.purple }
  ];

  function svg(content, title, viewBox) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (viewBox || '0 0 160 160') + '" role="img" aria-label="' + title + '" style="display:block;width:100%;max-height:260px"><title>' + title + '</title>' + content + '</svg>';
  }

  function grid(size, filled, title) {
    const step = 144 / size;
    let content = '';
    for (let index = 0; index < size * size; index++) {
      const active = filled.includes(index);
      content += '<rect ' + (active ? 'data-cell="' + index + '" ' : '') + 'x="' + (8 + index % size * step) + '" y="' + (8 + Math.floor(index / size) * step) + '" width="' + (step - 5) + '" height="' + (step - 5) + '" rx="5" fill="' + (active ? colors.orange : 'currentColor') + '"' + (active ? '' : ' opacity="0.09"') + '/>';
    }
    return svg(content, title);
  }

  function marks(shape, count, centerX, centerY) {
    const color = shape === 'triangle' ? colors.orange : shape === 'circle' ? colors.mint : colors.purple;
    let content = '';
    for (let i = 0; i < count; i++) {
      const x = centerX + (i - (count - 1) / 2) * 22;
      if (shape === 'triangle') content += '<polygon points="' + x + ',' + (centerY - 9) + ' ' + (x - 8) + ',' + (centerY + 7) + ' ' + (x + 8) + ',' + (centerY + 7) + '" fill="' + color + '"/>';
      else if (shape === 'circle') content += '<circle cx="' + x + '" cy="' + centerY + '" r="7" fill="' + color + '"/>';
      else content += '<rect x="' + (x - 7) + '" y="' + (centerY - 7) + '" width="14" height="14" rx="2" fill="' + color + '"/>';
    }
    return content;
  }

  const optionMarks = (shape, count, label) => ({ label, visual: svg(marks(shape, count, 60, 35), label, '0 0 120 70') });
  const numberSequence = values => '<div class="number-sequence" aria-label="' + values.join('，') + '">' + values.map(value => '<span>' + value + '</span>').join('') + '</div>';
  const numberOptions = values => values.map(value => ({ label: String(value) }));
  const gridOptions = (size, values) => values.map((filled, index) => ({ label: '图 ' + 'ABCD'[index], visual: grid(size, filled, '图 ' + 'ABCD'[index] + '，高亮位置为第 ' + filled.map(cell => (Math.floor(cell / size) + 1) + ' 行第 ' + (cell % size + 1) + ' 列').join('、')) }));

  const countingVisual = svg(
    marks('circle', 1, 48, 40) + marks('circle', 2, 132, 40) + marks('circle', 3, 222, 40) + '<text x="306" y="48" text-anchor="middle" font-size="28" fill="currentColor">?</text><path d="M84 24v32M174 24v32M270 24v32" stroke="currentColor" opacity="0.2"/>',
    '从左到右：1 个圆点、2 个圆点、3 个圆点、问号', '0 0 350 80');

  const cancellationVisual = '<div style="display:grid;gap:16px">' +
    '<div style="display:flex;align-items:center;gap:8px">' + grid(3, [0, 4], '示例左图：左上、中心') + '<span aria-hidden="true">⊕</span>' + grid(3, [4, 8], '示例右图：中心、右下') + '<span aria-hidden="true">=</span>' + grid(3, [0, 8], '示例结果：左上、右下') + '</div>' +
    '<div style="display:flex;align-items:center;gap:8px">' + grid(3, [2, 6], '题目左图：右上、左下') + '<span aria-hidden="true">⊕</span>' + grid(3, [2, 4], '题目右图：右上、中心') + '<span aria-hidden="true">=</span><span style="font-size:36px;flex:1;text-align:center">?</span></div></div>';

  const latinShapes = [['triangle', 'circle', 'square'], ['square', 'triangle', 'circle'], ['circle', 'square']];
  const latinCounts = [[1, 2, 3], [2, 3, 1], [3, 1]];
  let latinContent = '';
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    latinContent += '<rect x="' + (col * 105 + 3) + '" y="' + (row * 70 + 3) + '" width="99" height="64" rx="8" fill="currentColor" opacity="0.06"/>';
    latinContent += row === 2 && col === 2 ? '<text x="265" y="185" text-anchor="middle" font-size="30" fill="currentColor">?</text>' : marks(latinShapes[row][col], latinCounts[row][col], col * 105 + 52, row * 70 + 35);
  }
  const latinVisual = svg(latinContent, '九宫格。第一行：1 个三角形、2 个圆、3 个方块。第二行：2 个方块、3 个三角形、1 个圆。第三行：3 个圆、1 个方块、问号。', '0 0 315 210');

  let cubeContent = '';
  for (const [face, x, y] of [[1, 1, 1], [2, 1, 0], [3, 0, 1], [4, 2, 1], [5, 1, 2], [6, 1, 3]]) {
    cubeContent += '<rect x="' + (x * 62 + 13) + '" y="' + (y * 62 + 5) + '" width="58" height="58" rx="5" fill="' + (face === 1 ? colors.orange : colors.mint) + '" fill-opacity="' + (face === 1 ? '0.24' : '0.13') + '" stroke="' + (face === 1 ? colors.orange : colors.mint) + '" stroke-width="2"/>';
    cubeContent += '<text x="' + (x * 62 + 42) + '" y="' + (y * 62 + 43) + '" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="27" fill="currentColor">' + face + '</text>';
  }
  const cubeVisual = svg(cubeContent, '立方体展开图：1 的上方是 2，左边是 3，右边是 4，下方是 5，5 的下方是 6。', '0 0 210 258');

  const questions = [
    {
      id: 'q1', category: 'number', title: '等距的脚步',
      prompt: '这个数列每次增加同一个数。问号处应填几？',
      visual: numberSequence([3, 7, 11, 15, '?']), options: numberOptions([18, 19, 20, 23]), answer: 1,
      hint: '先计算相邻两项的差。',
      explanation: '7 − 3 = 4，11 − 7 = 4，15 − 11 = 4。每次都加 4，所以下一项是 15 + 4 = 19。'
    },
    {
      id: 'q2', category: 'pattern', title: '圆点接力',
      prompt: '从左往右，每格的圆点数都比上一格多 1 个。问号处是哪一幅？',
      visual: countingVisual,
      options: [optionMarks('circle', 2, '2 个圆点'), optionMarks('circle', 3, '3 个圆点'), optionMarks('circle', 5, '5 个圆点'), optionMarks('circle', 4, '4 个圆点')], answer: 3,
      hint: '数一数前三格中各有几个圆点。',
      explanation: '前三格分别有 1、2、3 个圆点。按每次多 1 个的规则，第四格应有 4 个圆点。'
    },
    {
      id: 'q3', category: 'logic', title: '谁站在中间',
      prompt: '小林、小周、小许三人站成一排。小林在小周左边，小许在小周右边。谁站在中间？',
      options: ['小周', '小林', '小许', '无法确定'].map(label => ({ label })), answer: 0,
      hint: '把两条线索放在同一条从左到右的线上。',
      explanation: '小林在小周左边，而小许在小周右边，所以从左到右只能是“小林—小周—小许”。站在中间的是小周。'
    },
    {
      id: 'q4', category: 'memory', title: '三点星光',
      prompt: '观察 5 秒，记住 3 个亮格。图案消失后，选回相同的 3 格。',
      gridSize: 3, cells: [0, 4, 6],
      hint: '把位置分成上、中、下三行，在心里画一条连线。',
      explanation: '按从上到下、从左到右的坐标，亮格是第 1 行第 1 列、第 2 行第 2 列、第 3 行第 1 列。它们形成一个向右突出的折线。'
    },
    {
      id: 'q5', category: 'spatial', title: '转个方向',
      prompt: '把整个 3 × 3 方格图绕中心顺时针旋转 90°，不移动单独的格子。结果是哪幅？',
      visual: grid(3, [0, 3, 4], '原图亮格：第 1 行第 1 列、第 2 行第 1 列、第 2 行第 2 列'),
      options: gridOptions(3, [[4, 5, 8], [1, 2, 4], [0, 3, 4], [4, 6, 7]]), answer: 1,
      hint: '先跟踪左上角的亮格：顺时针旋转后，它会到哪个角？',
      explanation: '顺时针旋转 90° 后，左上格到右上格，左中格到上中格，中心格不变。因此亮格是上中、右上和中心，对应图 B。'
    },
    {
      id: 'q6', category: 'number', title: '双轨列车',
      prompt: '奇数位置的数字每次加 2，偶数位置的数字每次加 3。问号处应填几？位置从左起数。',
      visual: numberSequence([2, 10, 4, 13, 6, 16, 8, '?']), options: numberOptions([17, 18, 19, 20]), answer: 2,
      hint: '把第 2、4、6、8 个数单独读出来。',
      explanation: '奇数位置是 2、4、6、8；偶数位置是 10、13、16、？。偶数位置每次加 3，因此问号是 16 + 3 = 19。'
    },
    {
      id: 'q7', category: 'pattern', title: '重叠后消失',
      prompt: '把两幅图叠在一起：同一位置都亮就熄灭，只有一幅亮就保留。上排是示例，下排的结果是哪幅？',
      visual: cancellationVisual, options: gridOptions(3, [[2, 4, 6], [4, 6], [2, 6], [0, 8]]), answer: 1,
      hint: '先找下排两幅图中共同亮着的格子。',
      explanation: '下排两图的右上格同时亮着，因此抵消。左下格只在左图中亮，中心格只在右图中亮，两格都保留。结果是中心和左下，对应图 B。'
    },
    {
      id: 'q8', category: 'logic', title: '只有一句真话',
      prompt: '宝物只在红、蓝、绿三个盒子中的一个。红盒写着“宝物在蓝盒”；蓝盒写着“宝物不在蓝盒”；绿盒写着“宝物不在红盒”。三句话恰好只有一句是真的。宝物在哪？',
      options: ['蓝盒', '绿盒', '红盒', '无法确定'].map(label => ({ label })), answer: 2,
      hint: '红盒和蓝盒的话互相矛盾，它们之中必有一句真话。',
      explanation: '“在蓝盒”和“不在蓝盒”恰好一真一假，已经用掉唯一的真话。因此绿盒说的“不在红盒”必须是假话，宝物就在红盒。此时三句依次是假、真、假，符合条件。'
    },
    {
      id: 'q9', category: 'memory', title: '四格坐标',
      prompt: '观察 5 秒，记住 4 × 4 网格中的 4 个亮格。图案消失后，选回相同位置。',
      gridSize: 4, cells: [1, 6, 8, 15],
      hint: '每行恰有一个亮格，可以只记每行亮格所在的列。',
      explanation: '四行亮格的列数依次为 2、3、1、4。也就是第 1 行第 2 列、第 2 行第 3 列、第 3 行第 1 列、第 4 行第 4 列。'
    },
    {
      id: 'q10', category: 'spatial', title: '镜中的阶梯',
      prompt: '以 4 × 4 方格图正中央的竖直线为镜轴，作左右镜像，上下位置保持不变。镜像是哪幅？',
      visual: grid(4, [0, 1, 5, 9], '原图：第 1 行第 1、2 列，第 2 行第 2 列，第 3 行第 2 列亮起'),
      options: gridOptions(4, [[0, 1, 5, 9], [2, 3, 6, 10], [4, 5, 6, 10], [2, 6, 10, 11]]), answer: 1,
      hint: '镜像时，第 1 列与第 4 列交换，第 2 列与第 3 列交换。',
      explanation: '左右镜像不改变行。第 1 行的第 1、2 列变成第 4、3 列；第 2、3 行的第 2 列都变成第 3 列。因此结果是图 B。'
    },
    {
      id: 'q11', category: 'number', title: '交替运算机',
      prompt: '从第一项开始，依次重复“乘 2 再加 1”和“减 3”这两步运算。问号处应填几？',
      visual: numberSequence([4, 9, 6, 13, 10, 21, 18, '?']), options: numberOptions([35, 36, 38, 37]), answer: 3,
      hint: '先判断从 21 到 18 用的是哪一步，下一步就用另一种运算。',
      explanation: '4 × 2 + 1 = 9，9 − 3 = 6；接着得到 13、10、21、18。21 到 18 用了“减 3”，下一步应“乘 2 再加 1”：18 × 2 + 1 = 37。'
    },
    {
      id: 'q12', category: 'pattern', title: '双重九宫格',
      prompt: '每一行、每一列都要同时满足：圆、方块、三角形各出现一格；格内图形数 1、2、3 各出现一次。问号格里应放什么？',
      visual: latinVisual,
      options: [optionMarks('triangle', 1, '1 个三角形'), optionMarks('circle', 2, '2 个圆'), optionMarks('triangle', 2, '2 个三角形'), optionMarks('square', 3, '3 个方块')], answer: 2,
      hint: '分别检查最后一行缺少的图形种类与数量，再用最后一列验证。',
      explanation: '最后一行已有圆和方块，缺三角形；数量已有 3 和 1，缺 2。最后一列已有方块和圆、数量 3 和 1，也要求 2 个三角形。因此两条规则都满足的答案是 2 个三角形。'
    },
    {
      id: 'q13', category: 'logic', title: '工作室的下午茶',
      prompt: '小林、小周、小许的职业分别是程序员、画家、作家，饮品分别是茶、咖啡、水，每种职业和饮品各一人。已知：小林不喝茶；画家喝咖啡；小周是作家；小许不喝咖啡；程序员喝水。小林的职业和饮品是？',
      options: ['程序员，喝水', '画家，喝茶', '画家，喝咖啡', '作家，喝茶'].map(label => ({ label })), answer: 2,
      hint: '画家和程序员的饮品已知，先想想作家只能喝什么。',
      explanation: '画家喝咖啡，程序员喝水，所以作家喝茶。小周是作家，喝茶。小许不喝咖啡，也不能喝已属于小周的茶，因此喝水，是程序员。剩下小林就是画家，喝咖啡。'
    },
    {
      id: 'q14', category: 'memory', title: '五点密钥',
      prompt: '最后一次记忆挑战：观察 5 秒，记住 4 × 4 网格中的 5 个亮格，再准确还原。',
      gridSize: 4, cells: [0, 3, 6, 9, 14],
      hint: '可以把最上面一行看成一组，再把其余位置串成一条路线。',
      explanation: '亮格是第 1 行第 1、4 列，第 2 行第 3 列，第 3 行第 2 列，以及第 4 行第 3 列。先记顶行两端，再记下方三行的列数 3、2、3。'
    },
    {
      id: 'q15', category: 'spatial', title: '折起一个立方体',
      prompt: '沿公共边把这张展开图折成一个立方体，每个数字占一个面。与 1 号面正相对的面是几号？',
      visual: cubeVisual, options: numberOptions([2, 4, 6, 5]), answer: 2,
      hint: '2、3、4、5 都直接连着 1 号面。折起后，它们会与 1 号面形成什么关系？',
      explanation: '2、3、4、5 都与 1 共用一条边，折起后都是 1 的相邻面。6 连在 5 的另一侧，继续折起就覆盖到 1 的对面。因此与 1 正相对的是 6 号面。'
    }
  ];

  return { questions, categories, chapters };
});
