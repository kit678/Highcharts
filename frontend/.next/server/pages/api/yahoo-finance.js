"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/api/yahoo-finance";
exports.ids = ["pages/api/yahoo-finance"];
exports.modules = {

/***/ "node-fetch":
/*!*****************************!*\
  !*** external "node-fetch" ***!
  \*****************************/
/***/ ((module) => {

module.exports = require("node-fetch");

/***/ }),

/***/ "(api)/./pages/api/yahoo-finance.js":
/*!************************************!*\
  !*** ./pages/api/yahoo-finance.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var node_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node-fetch */ \"node-fetch\");\n/* harmony import */ var node_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_fetch__WEBPACK_IMPORTED_MODULE_0__);\n// This file creates a Next.js API route to fetch Yahoo Finance data\n// We'll use node-fetch to make requests from our server-side API\n\nasync function handler(req, res) {\n    const { ticker , interval , range  } = req.query;\n    if (!ticker) {\n        return res.status(400).json({\n            error: \"Ticker symbol is required\"\n        });\n    }\n    // Default to 1-day interval and 1-month range if not specified\n    const dataInterval = interval || \"1d\";\n    const dataRange = range || \"1mo\";\n    try {\n        // Use Yahoo Finance API v8 (unofficial)\n        // Note: This is not an official API and could change without notice\n        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${dataInterval}&range=${dataRange}`;\n        const response = await node_fetch__WEBPACK_IMPORTED_MODULE_0___default()(url);\n        const data = await response.json();\n        if (data.chart.error) {\n            throw new Error(data.chart.error.description);\n        }\n        // Return the raw data without transformation - our service will handle that\n        return res.status(200).json(data);\n    } catch (error) {\n        console.error(\"Error fetching Yahoo Finance data:\", error);\n        return res.status(500).json({\n            error: error.message || \"Failed to fetch data\"\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaSkvLi9wYWdlcy9hcGkveWFob28tZmluYW5jZS5qcy5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvRUFBb0U7QUFDcEUsaUVBQWlFO0FBRWxDO0FBRWhCLGVBQWVDLE9BQU8sQ0FBQ0MsR0FBRyxFQUFFQyxHQUFHLEVBQUU7SUFDOUMsTUFBTSxFQUFFQyxNQUFNLEdBQUVDLFFBQVEsR0FBRUMsS0FBSyxHQUFFLEdBQUdKLEdBQUcsQ0FBQ0ssS0FBSztJQUU3QyxJQUFJLENBQUNILE1BQU0sRUFBRTtRQUNYLE9BQU9ELEdBQUcsQ0FBQ0ssTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7WUFBRUMsS0FBSyxFQUFFLDJCQUEyQjtTQUFFLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsK0RBQStEO0lBQy9ELE1BQU1DLFlBQVksR0FBR04sUUFBUSxJQUFJLElBQUk7SUFDckMsTUFBTU8sU0FBUyxHQUFHTixLQUFLLElBQUksS0FBSztJQUVoQyxJQUFJO1FBQ0Ysd0NBQXdDO1FBQ3hDLG9FQUFvRTtRQUNwRSxNQUFNTyxHQUFHLEdBQUcsQ0FBQyxrREFBa0QsRUFBRVQsTUFBTSxDQUFDLFVBQVUsRUFBRU8sWUFBWSxDQUFDLE9BQU8sRUFBRUMsU0FBUyxDQUFDLENBQUM7UUFFckgsTUFBTUUsUUFBUSxHQUFHLE1BQU1kLGlEQUFLLENBQUNhLEdBQUcsQ0FBQztRQUNqQyxNQUFNRSxJQUFJLEdBQUcsTUFBTUQsUUFBUSxDQUFDTCxJQUFJLEVBQUU7UUFFbEMsSUFBSU0sSUFBSSxDQUFDQyxLQUFLLENBQUNOLEtBQUssRUFBRTtZQUNwQixNQUFNLElBQUlPLEtBQUssQ0FBQ0YsSUFBSSxDQUFDQyxLQUFLLENBQUNOLEtBQUssQ0FBQ1EsV0FBVyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELDRFQUE0RTtRQUM1RSxPQUFPZixHQUFHLENBQUNLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDTSxJQUFJLENBQUMsQ0FBQztJQUNwQyxFQUFFLE9BQU9MLEtBQUssRUFBRTtRQUNkUyxPQUFPLENBQUNULEtBQUssQ0FBQyxvQ0FBb0MsRUFBRUEsS0FBSyxDQUFDLENBQUM7UUFDM0QsT0FBT1AsR0FBRyxDQUFDSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztZQUFFQyxLQUFLLEVBQUVBLEtBQUssQ0FBQ1UsT0FBTyxJQUFJLHNCQUFzQjtTQUFFLENBQUMsQ0FBQztJQUNsRixDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2dhbm5zcTktZnJvbnRlbmQvLi9wYWdlcy9hcGkveWFob28tZmluYW5jZS5qcz9hYzkyIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRoaXMgZmlsZSBjcmVhdGVzIGEgTmV4dC5qcyBBUEkgcm91dGUgdG8gZmV0Y2ggWWFob28gRmluYW5jZSBkYXRhXHJcbi8vIFdlJ2xsIHVzZSBub2RlLWZldGNoIHRvIG1ha2UgcmVxdWVzdHMgZnJvbSBvdXIgc2VydmVyLXNpZGUgQVBJXHJcblxyXG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgY29uc3QgeyB0aWNrZXIsIGludGVydmFsLCByYW5nZSB9ID0gcmVxLnF1ZXJ5O1xyXG4gIFxyXG4gIGlmICghdGlja2VyKSB7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ1RpY2tlciBzeW1ib2wgaXMgcmVxdWlyZWQnIH0pO1xyXG4gIH1cclxuICBcclxuICAvLyBEZWZhdWx0IHRvIDEtZGF5IGludGVydmFsIGFuZCAxLW1vbnRoIHJhbmdlIGlmIG5vdCBzcGVjaWZpZWRcclxuICBjb25zdCBkYXRhSW50ZXJ2YWwgPSBpbnRlcnZhbCB8fCAnMWQnO1xyXG4gIGNvbnN0IGRhdGFSYW5nZSA9IHJhbmdlIHx8ICcxbW8nO1xyXG4gIFxyXG4gIHRyeSB7XHJcbiAgICAvLyBVc2UgWWFob28gRmluYW5jZSBBUEkgdjggKHVub2ZmaWNpYWwpXHJcbiAgICAvLyBOb3RlOiBUaGlzIGlzIG5vdCBhbiBvZmZpY2lhbCBBUEkgYW5kIGNvdWxkIGNoYW5nZSB3aXRob3V0IG5vdGljZVxyXG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vcXVlcnkxLmZpbmFuY2UueWFob28uY29tL3Y4L2ZpbmFuY2UvY2hhcnQvJHt0aWNrZXJ9P2ludGVydmFsPSR7ZGF0YUludGVydmFsfSZyYW5nZT0ke2RhdGFSYW5nZX1gO1xyXG4gICAgXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgXHJcbiAgICBpZiAoZGF0YS5jaGFydC5lcnJvcikge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YS5jaGFydC5lcnJvci5kZXNjcmlwdGlvbik7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFJldHVybiB0aGUgcmF3IGRhdGEgd2l0aG91dCB0cmFuc2Zvcm1hdGlvbiAtIG91ciBzZXJ2aWNlIHdpbGwgaGFuZGxlIHRoYXRcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbihkYXRhKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgWWFob28gRmluYW5jZSBkYXRhOicsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdGYWlsZWQgdG8gZmV0Y2ggZGF0YScgfSk7XHJcbiAgfVxyXG59ICJdLCJuYW1lcyI6WyJmZXRjaCIsImhhbmRsZXIiLCJyZXEiLCJyZXMiLCJ0aWNrZXIiLCJpbnRlcnZhbCIsInJhbmdlIiwicXVlcnkiLCJzdGF0dXMiLCJqc29uIiwiZXJyb3IiLCJkYXRhSW50ZXJ2YWwiLCJkYXRhUmFuZ2UiLCJ1cmwiLCJyZXNwb25zZSIsImRhdGEiLCJjaGFydCIsIkVycm9yIiwiZGVzY3JpcHRpb24iLCJjb25zb2xlIiwibWVzc2FnZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(api)/./pages/api/yahoo-finance.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(api)/./pages/api/yahoo-finance.js"));
module.exports = __webpack_exports__;

})();