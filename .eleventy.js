const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Filtro para formatar datas
  eleventyConfig.addFilter("date", function(dateObj, format = "DD/MM/YYYY") {
    // Verifica se a data é válida
    const date = DateTime.fromJSDate(dateObj);
    if (!date.isValid) {
      return "Data inválida";  // Retorna uma mensagem caso a data seja inválida
    }
    return date.toFormat(format);  // Retorna a data formatada
  });

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
