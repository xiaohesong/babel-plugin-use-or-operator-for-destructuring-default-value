
export default function (babel, options) {
  const STOP_TRAVERSAL = {};
  const { types: t } = babel
  const arrays = {}
  const allowArrayLike = false

  function variableDeclarationHasPattern(node) {
    for (const declar of node.declarations) {
      if (t.isPattern(declar.id)) {
        return true;
      }
    }
    return false;
  }

  function hasRest(pattern) {
    for (const elem of pattern.elements) {
      if (t.isRestElement(elem)) {
        return true;
      }
    }
    return false;
  }

  const arrayUnpackVisitor = (node, ancestors, state) => {
    if (!ancestors.length) {
      return;
    }

    if (
      t.isIdentifier(node) &&
      t.isReferenced(node, ancestors[ancestors.length - 1]) &&
      state.bindings[node.name]
    ) {
      state.deopt = true;
      throw STOP_TRAVERSAL;
    }
  };

  function resolve({ scope, blockHoist, kind }, nodes) {

    function buildVariableDeclaration(id, init) {
      const declar = t.variableDeclaration("var", [
        t.variableDeclarator(t.cloneNode(id), t.cloneNode(init)),
      ]);
      declar._blockHoist = blockHoist;
      return declar;
    }

    function buildVariableAssignment(id, init) {
      const node = t.variableDeclaration(kind, [
        t.variableDeclarator(id, t.cloneNode(init)),
      ]);
      node._blockHoist = blockHoist;

      return node;
    }

    /**
     * const [name, age = 'defaultAge'] = ['xiaohesong', '']
     * [name, age = 'defaultAge'] is ArrayPattern
     */
    function arrayPattern(pattern, arrayRef) {
      const { elements } = pattern
      if (!elements) return;
      if (canUnpackArrayPattern(pattern, arrayRef)) {
        return pushUnpackedArrayPattern(pattern, arrayRef);
      }

      const count = !hasRest(pattern) && pattern.elements.length;

      const toArr = toArray(arrayRef, count);

      if (t.isIdentifier(toArr)) {
        arrayRef = toArr;
      } else {
        arrayRef = scope.generateUidIdentifierBasedOnNode(arrayRef);
        arrays[arrayRef.name] = true;
        nodes.push(buildVariableDeclaration(arrayRef, toArr));
      }

      for (let e = 0; e < elements.length; e++) {
        const element = elements[e]
        if (!element) continue;
        let elemRef;

        if (t.isRestElement(element)) {
          elemRef = toArray(arrayRef);
          elemRef = t.callExpression(
            t.memberExpression(elemRef, t.identifier("slice")),
            [t.numericLiteral(e)],
          );
          element = elem.argument;
        } else {
          elemRef = t.memberExpression(arrayRef, t.numericLiteral(e), true);
        }

        push(element, elemRef)
      }
    }

    function toArray(node, count) {
      if (
        (t.isIdentifier(node) && arrays[node.name])
      ) {
        return node;
      } else {
        return scope.toArray(node, count, allowArrayLike);
      }
    }

    function canUnpackArrayPattern(pattern, arr) {
      if (!t.isArrayExpression(arr)) return false;

      if (pattern.elements.length > arr.elements.length) return;
      if (pattern.elements.length < arr.elements.length && !hasRest(pattern)) {
        return false;
      }

      for (const elem of pattern.elements) {
        if (!elem) return false;

        if (t.isMemberExpression(elem)) return false;
      }

      for (const elem of arr.elements) {
        if (t.isSpreadElement(elem)) return false;

        if (t.isCallExpression(elem)) return false;

        if (t.isMemberExpression(elem)) return false;
      }

      const bindings = t.getBindingIdentifiers(pattern);
      const state = { deopt: false, bindings };

      try {
        t.traverse(arr, arrayUnpackVisitor, state);
      } catch (e) {
        if (e !== STOP_TRAVERSAL) throw e;
      }

      return !state.deopt;
    }

    function pushUnpackedArrayPattern(pattern, arr) {
      for (let i = 0; i < pattern.elements.length; i++) {
        const elem = pattern.elements[i];
        if (t.isRestElement(elem)) {
          push(elem.argument, t.arrayExpression(arr.elements.slice(i)));
        } else {
          push(elem, arr.elements[i]);
        }
        
      }
    }

    function assignmentPattern({ left, right }, valueRef) {
      const tempId = scope.generateUidIdentifierBasedOnNode(valueRef);
      nodes.push(buildVariableDeclaration(tempId, valueRef))
      const tempConditional = t.logicalExpression('||', t.cloneNode(tempId), right)
      nodes.push(buildVariableAssignment(left, tempConditional))
    }

    /**
     * const obj =  {name: 'xiaohesong', age: null, sex: '' }
     * const {name, age = 'defaultAgeValue', sex = 'defaultSexValue'} = obj
     * {name, age = 'defaultAgeValue', sex = 'defaultSexValue'} is ObjectPattern
     */

    function objectPattern(pattern, objRef) {
      for (let i = 0; i < pattern.properties.length; i++) {
        const prop = pattern.properties[i];
        objectProperty(prop, objRef);
      }
    }

    function objectProperty(prop, propRef) {
      if (t.isLiteral(prop.key)) prop.computed = true;

      const pattern = prop.value;
      const objRef = t.memberExpression(
        t.cloneNode(propRef),
        prop.key,
        prop.computed,
      );

      if (t.isPattern(pattern)) {
        push(pattern, objRef);
      } else {
        nodes.push(buildVariableAssignment(pattern, objRef));
      }
    }

    function push(id, _init) {
      const init = t.cloneNode(_init);
      if (t.isObjectPattern(id)) {
        objectPattern(id, init);
      } else if (t.isArrayPattern(id)) {
        arrayPattern(id, init);
      } else if (t.isAssignmentPattern(id)) {
        assignmentPattern(id, init);
      } else {
        nodes.push(buildVariableAssignment(id, init));
      }
    }


    return {
      push,
      buildVariableAssignment
    }
  }

  return {
    visitor: {
      "VariableDeclaration"(path) {
        const { node, scope, parent, node: { declarations, _blockHoist } } = path;
        // 如果没有pattern模式就不继续向下处理
        if (!variableDeclarationHasPattern(node)) return;
        const nodes = []
        const nodeKind = node.kind;
        const blockHoist = node._blockHoist
        let declaration
        for (let i = 0; i < declarations.length; i++) {
          declaration = declarations[i]
          const patternRef = declaration.init;
          const pattern = declaration.id;
          const reslover = resolve({ scope, blockHoist, kind: nodeKind }, nodes)
          if (t.isPattern(pattern)) {
            reslover.push(pattern, patternRef)
            if (+i !== node.declarations.length - 1) {
              // we aren't the last declarator so let's just make the
              // last transformed node inherit from us
              t.inherits(nodes[nodes.length - 1], declar);
            }
          }else {
            nodes.push(
              t.inherits(
                reslover.buildVariableAssignment(
                  declaration.id,
                  t.cloneNode(declaration.init),
                ),
                declaration,
              ),
            );
          }

        }

        let tail = null;
        const nodesOut = [];
        for (const node of nodes) {
          if (tail !== null && t.isVariableDeclaration(node)) {
            tail.declarations.push(...node.declarations);
          } else {
            node.kind = nodeKind;
            nodesOut.push(node);
            tail = t.isVariableDeclaration(node) ? node : null;
          }
        }

        for (const nodeOut of nodesOut) {
          if (!nodeOut.declarations) continue;
          for (const declaration of nodeOut.declarations) {
            const { name } = declaration.id;
            if (scope.bindings[name]) {
              scope.bindings[name].kind = nodeOut.kind;
            }
          }
        }

        if (nodesOut.length === 1) {
          path.replaceWith(nodesOut[0]);
        } else {
          path.replaceWithMultiple(nodesOut);
        }

      }
    },
  }
}
