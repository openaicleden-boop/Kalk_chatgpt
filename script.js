const expressionInput = document.getElementById("expression");
const resultOutput = document.getElementById("result");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistory");
const buttons = document.querySelectorAll("button");

const history = [];

const functionsMap = {
  sin: (value) => Math.sin(toRadians(value)),
  cos: (value) => Math.cos(toRadians(value)),
  tan: (value) => Math.tan(toRadians(value)),
  sqrt: (value) => Math.sqrt(value),
  log: (value) => Math.log10(value),
  ln: (value) => Math.log(value),
};

const constantsMap = {
  pi: Math.PI,
  e: Math.E,
};

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function sanitizeExpression(expression) {
  return expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\s+/g, "");
}

function validateExpression(expression) {
  return /^[0-9+\-*/^().,%a-z]*$/i.test(expression);
}

function replaceTokens(expression) {
  let result = expression;

  Object.entries(constantsMap).forEach(([token, value]) => {
    const regex = new RegExp(`(?<![a-zA-Z])${token}(?![a-zA-Z])`, "g");
    result = result.replace(regex, value.toString());
  });

  Object.entries(functionsMap).forEach(([token, fn]) => {
    const regex = new RegExp(`${token}\(`, "g");
    result = result.replace(regex, `__fn.${token}(`);
  });

  result = result.replace(/\^/g, "**");

  return result;
}

function evaluateExpression(rawExpression) {
  if (!rawExpression) {
    return "0";
  }

  const sanitized = sanitizeExpression(rawExpression);

  if (!validateExpression(sanitized)) {
    return "Ошибка";
  }

  try {
    const prepared = replaceTokens(sanitized);
    const compute = new Function("__fn", `return ${prepared}`);
    const value = compute(functionsMap);

    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return "Ошибка";
    }

    return value.toString();
  } catch (error) {
    return "Ошибка";
  }
}

function updateResult() {
  const expression = expressionInput.value;
  resultOutput.textContent = evaluateExpression(expression);
}

function appendHistory(expression, result) {
  history.unshift({ expression, result });
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  history.slice(0, 10).forEach((item) => {
    const listItem = document.createElement("li");
    const expr = document.createElement("span");
    const res = document.createElement("span");
    expr.className = "history__expression";
    res.className = "history__result";
    expr.textContent = item.expression;
    res.textContent = item.result;
    listItem.append(expr, res);
    listItem.addEventListener("click", () => {
      expressionInput.value = item.expression;
      updateResult();
    });
    historyList.appendChild(listItem);
  });
}

function handleButtonClick(event) {
  const button = event.currentTarget;
  const value = button.dataset.value;
  const action = button.dataset.action;

  if (action === "clear") {
    expressionInput.value = "";
    updateResult();
    return;
  }

  if (action === "backspace") {
    expressionInput.value = expressionInput.value.slice(0, -1);
    updateResult();
    return;
  }

  if (action === "percent") {
    expressionInput.value = `${expressionInput.value}*0.01`;
    updateResult();
    return;
  }

  if (action === "equals") {
    const expression = expressionInput.value;
    const result = evaluateExpression(expression);
    if (result !== "Ошибка") {
      appendHistory(expression, result);
      expressionInput.value = result;
    }
    updateResult();
    return;
  }

  if (value) {
    expressionInput.value += value;
    updateResult();
  }
}

expressionInput.addEventListener("input", updateResult);
expressionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const expression = expressionInput.value;
    const result = evaluateExpression(expression);
    if (result !== "Ошибка") {
      appendHistory(expression, result);
      expressionInput.value = result;
    }
    updateResult();
  }
});

buttons.forEach((button) => {
  button.addEventListener("click", handleButtonClick);
});

clearHistoryButton.addEventListener("click", () => {
  history.length = 0;
  renderHistory();
});

updateResult();
