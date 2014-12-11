/**
 * All reading related code here.
 */

exports.docs = [];
exports.process = process;

var ngdoc = require('./ngdoc.js'),
    NEW_LINE = /\n\r?/;

function process(content, file, section, options) {
  if (options && options.condition) {
    if (exclude(content, file, options)) return;
  }
  if (/\.js$/.test(file)) {
    processJsFile(content, file, section, options).forEach(function (doc) {
      exports.docs.push(doc);
    });
  } else if (file.match(/\.ngdoc$/)) {
    var header = '@section ' + section + '\n';
    exports.docs.push(new ngdoc.Doc(header + content.toString(), file, 1, options).parse());
  }
}

var isTagged = function (tag, condition) {

  var hasTag = false
  var tags = tag.split('|')
  for (var i = 0; i < tags.length; ++i) {
    if (tags[i] == condition) {
      hasTag = true;
      continue
    }
  }
  return hasTag
}

// exclude entire pages which have the @tag xxxx when yyyy is specified in the options
// able to deal with multiple tags delimited by a bar '|'
function exclude(content, file, options) {
  var exclude = false;

  var headers = content
      .toString()
      .split(NEW_LINE)
      .slice(0, 5);  // assume the @tag is within the first five lines

  headers.forEach(function (line) {
    var match = line.match(/^@tag\s+(.*)/);

    if (match != null) {
      exclude = !isTagged(match[1], options.condition);
    }

  });

  return exclude;
}

function processJsFile(content, file, section, options) {
  var docs = [];
  var lines = content.toString().split(NEW_LINE);
  var text;
  var startingLine;
  var match;
  var inDoc = false;

  lines.forEach(function (line, lineNumber) {
    lineNumber++;
    // is the comment starting?
    if (!inDoc && (match = line.match(/^\s*\/\*\*\s*(.*)$/))) {
      line = match[1];
      inDoc = true;
      text = [];
      startingLine = lineNumber;
    }
    // are we done?
    if (inDoc && line.match(/\*\//)) {
      text = text.join('\n');
      text = text.replace(/^\n/, '');
      if (text.match(/@ngdoc/)) {
        //console.log(file, startingLine)
        docs.push(new ngdoc.Doc('@section ' + section + '\n' + text, file, startingLine, options).parse());
      }
      doc = null;
      inDoc = false;
    }
    // is the comment add text
    if (inDoc) {
      text.push(line.replace(/^\s*\*\s?/, ''));
    }
  });
  return docs;
}
