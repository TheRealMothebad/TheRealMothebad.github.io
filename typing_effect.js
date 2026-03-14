function startTyping() {

  const page_content = document.getElementsByClassName("terminal-body")[0];

  const allElements = Array.from(page_content.querySelectorAll("p, a, u, h2, h3, code, span, pre, img"))
    .filter(el => el.textContent.trim().length > 0 || el.tagName === "IMG" || el.querySelector("img"));

  const elements = allElements.filter(el =>
    !allElements.some(other => other !== el && other.contains(el))
  );

  const terminal = document.getElementsByClassName("terminal-body")[0]

  if (window.scrollY > 0 || terminal.scrollTop > 0) {
  page_content.querySelectorAll("*").forEach(el => {
    el.style.visibility = "visible";

    if (el.tagName === "IMG") {
      el.style.opacity = "1";
    }
  });
  return;
}

  function typeNodes(nodes, parent, done, isLastPath) {
    let i = 0;

    function next() {
      if (i >= nodes.length) return done();
      const node = nodes[i++];
      const isLastNode = isLastPath && i === nodes.length;

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
            if (isLastNode) {
              let visible = true;
              setInterval(() => {
                visible = !visible;
                textNode.textContent = text + (visible ? "█" : "");
              }, 500);
            } else {
              textNode.textContent = text; // remove cursor
              next();
            }
          }
        })();
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        clone.style.visibility = "visible";
        parent.appendChild(clone);
        if (clone.tagName === "IMG") {
          // trigger fade-in transition
          setTimeout(() => { clone.style.opacity = "1"; }, 10);
        }
        const children = Array.from(node.childNodes);
        typeNodes(children, clone, next, isLastNode);
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
    if (el.tagName === "IMG") {
      setTimeout(() => { el.style.opacity = "1"; }, 10);
    }

    const isLastElement = index === elements.length - 1;
    typeNodes(originalNodes, el, () => typeElement(index + 1), isLastElement);
  }

  setTimeout(() => {
    typeElement(0);
  }, 20);
}


window.addEventListener("load", startTyping);

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    startTyping();
  }
});
