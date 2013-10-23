var Parser = require("../lib/html5-parser/lib/main.js").Parser;

function Compile(template) {
  var parser = new Parser(template, {type: "tree", fragment: "body"});
  parser.run();

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
            "stack.push(" + (Object.keys(node.attributes).length ? "tmp = " : "") + "template.a(document.createElement(" + JSON.stringify(node._tagName) + "), stack));",
            (Object.keys(node.attributes).length ? Object.keys(node.attributes).map(renderAttribute(node.attributes)).join("\n") : ""),
            node.childNodes.map(renderNode).join(""),
            "stack.pop();"
          ].join("\n");
        } else {
          return (Object.keys(node.attributes).length ? "tmp = " : "") + "template.a(document.createElement(" + JSON.stringify(node._tagName) + "), stack);";
        }
        break;
      case 3:
        return "template.a(document.createTextNode(" + JSON.stringify(node.data) + "), stack);";
      case -1:
        return "template.a(document.createTextNode(template.t('" + node.name + "', data, context)), stack);";
      case -2:
        return [
          "template.b(" + JSON.stringify(node._tagName) + ", context)",
          node.childNodes.map(renderNode).join(""),
          "context.pop();"
        ].join("\n");
      default:
        return "";
    }
  }

  var functionBody = parser.constructor.childNodes.map(renderNode);
  functionBody.push("return fragment");
  return new Function("template", "data", "options", "document", "fragment", "stack", "context", functionBody.join("\n"));
}

function AliveTemplate(template) {
  this.template = template;
}

AliveTemplate.prototype.render = function(data, options) {
  data = typeof(data) !== "object" ? {} : data;
  options = options || {};
  var document = options.document || document;
  var fragment = document.createDocumentFragment();
  return this.template(this, data, options, document, fragment, [fragment], []);
};

// append node to top-most node in stack
AliveTemplate.prototype.a = function(node, stack) {
  return stack[stack.length - 1].appendChild(node);
};

AliveTemplate.prototype.b = function(name, context) {
  context.push(name);
};

AliveTemplate.prototype.t = function(name, data, context) {
  var variable = this.lookup(data, context, name).value;
  return variable ? String(variable) : "";
};

AliveTemplate.prototype.lookup = function(data, context, name, index) {
  var contextLookup = data,
    match = (name !== ".") ? data[name] : data,
    split = name.split("."),
    dottedName = split.length > 1,
    stack = [],
    matchStack = [];

  if (name !== ".") {
    name = split.pop();
    context = context.concat(split);
  }

  for (var i = 0, len = context.length; i < len; i++) {
    if (contextLookup[context[i]] !== undefined) {
      contextLookup = contextLookup[context[i]];
      stack.push(context[i]);
      if (contextLookup[name] && name !== ".") {
        match = contextLookup[name];
        matchStack.push(context[i]);
      }
    } else if (data[context[i]] !== undefined && data[context[i]][name] && name !== "." && !dottedName) {
      contextLookup = data[context[i]];
      stack.push(data[context[i]]);
      matchStack.push(data[context[i]]);
      match = contextLookup[name];
    }
  }

  if (index !== undefined) {
    contextLookup = contextLookup[index];
  }

  if (name !== "." && contextLookup) {
    if (contextLookup[name] !== undefined) {
      return {
        value: contextLookup[name],
        context: stack
      };
    } else {
      return {
        value: match,
        context: matchStack
      };
    }
  }
  return {
    value: contextLookup,
    context: stack
  };
};

exports.AliveTemplate = AliveTemplate;
exports.Compile = Compile;
