var Parser = require("../lib/html5-parser/lib/tokenizer.js").Parser;

function Compile(template) {
  var functionRegExp = /^function\s?\((.*)\)\s?\{(\s*)([\s\S]*)\}$/;
  var parser = new Parser(template, {type: "tree", fragment: "body"});
  parser.run();

  function trim(str) {
    return str.trim();
  }

  function renderNode(node) {

    switch(node.nodeType) {
      case 1:
        if (node.childNodes.length) {
          return [
            "stack.push(append(document.createElement(" + JSON.stringify(node._tagName) + ")));",
            node.childNodes.map(renderNode).join(""),
            "stack.pop();"
          ].join("\n");
        } else {
          return "append(document.createElement(" + JSON.stringify(node._tagName) + "));";
        }
        break;
      case 3:
        return "append(document.createTextNode(" + JSON.stringify(node.data) + "));";
      default:
        return "";
    }
  }

  function extractFunctionArguments(func) {
    return func.toString().replace(functionRegExp, function() {
      return arguments[1];
    }).split(",").map(trim);
  }

  function extractFunctionBody(func) {
    return func.toString().replace(functionRegExp, function() {
      return arguments[3];
    });
  }


  var functionStart = function(data, options) {
    options = options || {};
    var document = options.document || document,
      fragment = document.createDocumentFragment(), stack = [fragment],
      append = function(node) {
        return stack[stack.length - 1].appendChild(node);
      };

  };

  var functionBody = [extractFunctionBody(functionStart)].concat(parser.constructor.childNodes.map(renderNode));
  functionBody.push("return fragment");
  return new Function(extractFunctionArguments(functionStart), functionBody.join(""));
}



exports.Compile = Compile;
