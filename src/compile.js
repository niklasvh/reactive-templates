var Parser = require("../lib/html5-parser/lib/main.js").Parser;

function Compile(template) {
  var functionRegExp = /^function\s?\((.*)\)\s?\{(\s*)([\s\S]*)\}$/;
  var parser = new Parser(template, {type: "tree", fragment: "body"});
  parser.run();

  function trim(str) {
    return str.trim();
  }

  function renderAttribute(attributes) {
    return function(attributeName) {
      return "tmp.setAttribute(" + JSON.stringify(attributeName) + "," + JSON.stringify(attributes[attributeName]) + ");";
    };
  }

  function renderNode(node) {

    switch(node.nodeType) {
      case 1:
        if (node.childNodes.length) {
          return [
            "stack.push(" + (Object.keys(node.attributes).length ? "tmp = " : "") + "append(document.createElement(" + JSON.stringify(node._tagName) + ")));",
            (Object.keys(node.attributes).length ? Object.keys(node.attributes).map(renderAttribute(node.attributes)).join("\n") : ""),
            node.childNodes.map(renderNode).join(""),
            "stack.pop();"
          ].join("\n");
        } else {
          return (Object.keys(node.attributes).length ? "tmp = " : "") + "append(document.createElement(" + JSON.stringify(node._tagName) + "));";
        }
        break;
      case 3:
        return "append(document.createTextNode(" + JSON.stringify(node.data) + "));";
      case -1:
        return "append(document.createTextNode(text('" + node.name + "', data)));";
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
    data = typeof(data) !== "object" ? {} : data;
    options = options || {};
    var document = options.document || document,
      fragment = document.createDocumentFragment(), stack = [fragment],
      tmp,
      text = function(name, data) {
        var variable = data[name];
        return variable ? String(variable) : "";
      },
      resolve = function(name, data) {

      },
      append = function(node) {
        return stack[stack.length - 1].appendChild(node);
      };

  };

  var functionBody = [extractFunctionBody(functionStart)].concat(parser.constructor.childNodes.map(renderNode));
  functionBody.push("return fragment");
  return new Function(extractFunctionArguments(functionStart), functionBody.join("\n"));
}



exports.Compile = Compile;
