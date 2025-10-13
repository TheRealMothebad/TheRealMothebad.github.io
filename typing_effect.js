window.addEventListener("load", () => {

  const elements = Array.from(document.body.querySelectorAll("p, a, u, h2, h3, code, span, pre"))
    .filter(el => el.textContent.trim().length > 0);

  if (window.scrollY > 0) {
    elements.forEach(el => el.style.visibility = "visible");
    return;
  }

  function typeNodes(nodes, parent, done) {
    let i = 0;

    function next() {
      if (i >= nodes.length) return done();
      const node = nodes[i++];

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        let j = 0;
        const textNode = document.createTextNode("");
        parent.appendChild(textNode);

        (function typeChar() {
          if (j < text.length) {
            textNode.textContent = text.slice(0, j + 1) + "█";
            j++;
            setTimeout(typeChar, 1 + Math.random() * 12);
          } else {
            textNode.textContent = text; // remove cursor
            next();
          }
        })();
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        parent.appendChild(clone);
        const children = Array.from(node.childNodes);
        typeNodes(children, clone, next);
      } else {
        next();
      }
    }

    next();
  }

  function typeElement(index) {
    if (index >= elements.length) return;
    const el = elements[index];
    const originalNodes = Array.from(el.childNodes);
    el.innerHTML = "";
    el.style.visibility = "visible";

    typeNodes(originalNodes, el, () => typeElement(index + 1));
  }

  setTimeout(() => {
    typeElement(0);
  }, 20);
});

