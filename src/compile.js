var Parser = require("../lib/html5-parser/lib/main.js").Parser;

function Compile(template) {
  var parser = new Parser(template, {type: "tree", fragment: "body"}),
    ELEMENT_NODE = 1,
    TEXT_NODE = 3,
    VARIABLE = -1,
    BLOCK = -2,
    WITH_BLOCK = -3;
  parser.run();

  function renderAttribute(attributes) {
    return function(attributeName) {
      return "tmp.setAttribute(" + JSON.stringify(attributeName) + "," + JSON.stringify(attributes[attributeName]) + ");";
    };
  }

  function renderNode(node) {
    switch(node.nodeType) {
      case ELEMENT_NODE:
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
      case TEXT_NODE:
        return "template.a(document.createTextNode(" + JSON.stringify(node.data) + "), stack);";
      case VARIABLE:
        return "template.a(document.createTextNode(template.t('" + node.name + "', context)), stack);";
      case BLOCK:
        return [
          "template.b(" + JSON.stringify(node._tagName) + ", context, function(context) {",
          node.childNodes.map(renderNode).join(""),
          "});"
        ].join("\n");
      case WITH_BLOCK:
        return [
          "template.w(" + JSON.stringify(node._tagName) + ", " + JSON.stringify(node.variable) + ", context, function(context) {",
          node.childNodes.map(renderNode).join(""),
          "});"
        ].join("\n");
      default:
        return "";
    }
  }

  return new Function("template", "document", "stack", "context", "tmp", "index", parser.constructor.childNodes.map(renderNode).join("\n"));
}

function Context(data, context) {
  this.data = data;
  this.context = context.slice(0);
  this.index = null;
}

Context.prototype.lookup = function(name) {
  var context = this.context;
  var contextLookup = this.data,
    match = (name !== ".") ? this.data[name] : this.data,
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
    } else if (this.data[context[i]] !== undefined && this.data[context[i]][name] && name !== "." && !dottedName) {
      contextLookup = this.data[context[i]];
      stack.push(this.data[context[i]]);
      matchStack.push(this.data[context[i]]);
      match = contextLookup[name];
    }
  }

  if (this.index !== null) {
    contextLookup = contextLookup[this.index];
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

function AliveTemplate(template) {
  this.template = template;
}

AliveTemplate.prototype.render = function(data, options) {
  data = typeof(data) !== "object" ? {} : data;
  options = options || {};
  var document = options.document || document;
  var fragment = document.createDocumentFragment();
  this.template(this, document, [fragment], new Context(data, []));
  return fragment;
};

// append node to top-most node in stack
AliveTemplate.prototype.a = function(node, stack) {
  return stack[stack.length - 1].appendChild(node);
};

AliveTemplate.prototype.b = function(name, parentContext, callback) {
  var item = parentContext.lookup(name), self = this;
  var blockContext = new Context(item.value, parentContext.context);
  blockContext.context.push(name);
  if (Array.isArray(item.value)) {
    item.value.forEach(function(value, index) {
      blockContext.index = index;
      callback.call(self, blockContext);
    });
  } else {
    callback.call(this, blockContext);
  }
};

AliveTemplate.prototype.t = function(name, context) {
  var variable = context.lookup(name).value;
  return variable ? String(variable) : "";
};

AliveTemplate.prototype.w = function(type, name, parentContext, callback) {
  return this[type](name, parentContext, callback);
};

AliveTemplate.prototype.if = function(name, parentContext, callback) {
  if (!this.falsy(parentContext.lookup(name).value)) {
    callback.call(this, parentContext);
  }
};

AliveTemplate.prototype.falsy = function(variable) {
  return (variable === false || typeof(variable) === "undefined" || variable === null || variable === "" || (Array.isArray(variable) && variable.length === 0));
};

exports.AliveTemplate = AliveTemplate;
exports.Compile = Compile;
