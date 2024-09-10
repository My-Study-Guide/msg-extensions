const pageHTML = document.documentElement.outerHTML;
const pageText = document.body.innerText;
// const pageHTML = document.documentElement.outerHTML;
// const pageText = pageHTML.replace(/<[^>]*>/g, '');
console.log(pageText);
console.log(pageHTML);

// DOM 트리를 직접 탐색해서 텍스트 추출하기
// function getTextFromNode(node) {
//     let text = '';
//     if (node.nodeType === Node.TEXT_NODE) {
//         text += node.nodeValue.trim();
//     }
//     for (let child of node.childNodes) {
//         text += getTextFromNode(child);
//     }
//     return text;
// }

// const pageText = getTextFromNode(document.body);