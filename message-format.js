// ============ メッセージフォーマット (共通ユーティリティ) ============

// CSS injection for formatted elements
(function() {
  var style = document.createElement('style');
  style.textContent =
    '.msg-code-block { background:#1a1d21; border:1px solid #383838; border-radius:6px; padding:8px 12px; font-family:"SFMono-Regular",Consolas,"Courier New",monospace; font-size:12px; overflow-x:auto; white-space:pre; margin:4px 0; color:#d4d4d4; }' +
    '.msg-inline-code { background:#2a2d32; border:1px solid #383838; border-radius:3px; padding:1px 5px; font-family:"SFMono-Regular",Consolas,"Courier New",monospace; font-size:12px; color:#e06c75; }' +
    '.msg-blockquote { border-left:4px solid #555; padding:2px 0 2px 12px; margin:4px 0; color:#ababad; }' +
    '.msg-list-item { padding-left:4px; }';
  document.head.appendChild(style);
})();

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessageText(text) {
  var s = escapeHtml(text);

  // 1. Protect code blocks ```...```
  var codeBlocks = [];
  s = s.replace(/```([\s\S]*?)```/g, function(_, code) {
    var i = codeBlocks.length;
    codeBlocks.push('<pre class="msg-code-block"><code>' + code.replace(/^\n|\n$/g, '') + '</code></pre>');
    return '\x00CB' + i + '\x00';
  });

  // 2. Protect inline code `...`
  var inlineCodes = [];
  s = s.replace(/`([^`\n]+)`/g, function(_, code) {
    var i = inlineCodes.length;
    inlineCodes.push('<code class="msg-inline-code">' + code + '</code>');
    return '\x00IC' + i + '\x00';
  });

  // 3. Bold *text*
  s = s.replace(/\*([^\*\n]+)\*/g, '<strong>$1</strong>');

  // 4. Italic _text_ (with word boundary check)
  s = s.replace(/(^|[\s(])_([^_\n]+)_([\s).,!?;:]|$)/gm, '$1<em>$2</em>$3');

  // 5. Underline __text__
  s = s.replace(/__([^_\n]+)__/g, '<u>$1</u>');

  // 6. Strikethrough ~text~
  s = s.replace(/~([^~\n]+)~/g, '<s>$1</s>');

  // 6. Blockquote > text (at line start; > is escaped to &gt;)
  s = s.replace(/^&gt; (.+)$/gm, '<blockquote class="msg-blockquote">$1</blockquote>');

  // 7. Bullet list items
  s = s.replace(/^[•\-] (.+)$/gm, '<div class="msg-list-item">• $1</div>');

  // 8. Numbered list items
  s = s.replace(/^(\d+)\. (.+)$/gm, '<div class="msg-list-item">$1. $2</div>');

  // 9. URL auto-linking
  s = s.replace(/(https?:\/\/[^\s<&]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#1D9BD1;">$1</a>');

  // 10. Line breaks
  s = s.replace(/\n/g, '<br>');

  // Clean up <br> after block elements
  s = s.replace(/<\/blockquote><br>/g, '</blockquote>');
  s = s.replace(/<\/pre><br>/g, '</pre>');
  s = s.replace(/<\/div><br>/g, '</div>');

  // Restore protected code
  for (var i = 0; i < codeBlocks.length; i++) {
    s = s.replace('\x00CB' + i + '\x00', codeBlocks[i]);
  }
  for (var i = 0; i < inlineCodes.length; i++) {
    s = s.replace('\x00IC' + i + '\x00', inlineCodes[i]);
  }

  return s;
}

function insertFormatting(textarea, type) {
  if (!textarea) return;

  var start = textarea.selectionStart;
  var end = textarea.selectionEnd;
  var text = textarea.value;
  var selected = text.substring(start, end);
  var before = text.substring(0, start);
  var after = text.substring(end);

  var prefix = '', suffix = '', defaultText = '';

  switch (type) {
    case 'bold':
      prefix = '*'; suffix = '*'; defaultText = 'テキスト'; break;
    case 'italic':
      prefix = '_'; suffix = '_'; defaultText = 'テキスト'; break;
    case 'underline':
      prefix = '__'; suffix = '__'; defaultText = 'テキスト'; break;
    case 'strikethrough':
      prefix = '~'; suffix = '~'; defaultText = 'テキスト'; break;
    case 'code':
      if (selected && selected.indexOf('\n') >= 0) {
        prefix = '```\n'; suffix = '\n```';
      } else {
        prefix = '`'; suffix = '`'; defaultText = 'コード';
      }
      break;
    case 'link':
      var url = prompt('URLを入力してください', 'https://');
      if (!url) return;
      textarea.value = before + url + after;
      textarea.selectionStart = start;
      textarea.selectionEnd = start + url.length;
      textarea.focus();
      textarea.dispatchEvent(new Event('input'));
      return;
    case 'bullet':
      var bulleted = selected ? selected.split('\n').map(function(l) { return '• ' + l; }).join('\n') : '• ';
      textarea.value = before + bulleted + after;
      textarea.selectionStart = start;
      textarea.selectionEnd = start + bulleted.length;
      textarea.focus();
      textarea.dispatchEvent(new Event('input'));
      return;
    case 'numbered':
      var numbered = selected ? selected.split('\n').map(function(l, i) { return (i+1) + '. ' + l; }).join('\n') : '1. ';
      textarea.value = before + numbered + after;
      textarea.selectionStart = start;
      textarea.selectionEnd = start + numbered.length;
      textarea.focus();
      textarea.dispatchEvent(new Event('input'));
      return;
    case 'blockquote':
      var quoted = selected ? selected.split('\n').map(function(l) { return '> ' + l; }).join('\n') : '> ';
      textarea.value = before + quoted + after;
      textarea.selectionStart = start;
      textarea.selectionEnd = start + quoted.length;
      textarea.focus();
      textarea.dispatchEvent(new Event('input'));
      return;
    default:
      return;
  }

  var inner = selected || defaultText;
  var insertion = prefix + inner + suffix;
  textarea.value = before + insertion + after;

  if (selected) {
    textarea.selectionStart = start;
    textarea.selectionEnd = start + insertion.length;
  } else {
    textarea.selectionStart = start + prefix.length;
    textarea.selectionEnd = start + prefix.length + defaultText.length;
  }

  textarea.focus();
  textarea.dispatchEvent(new Event('input'));
}
