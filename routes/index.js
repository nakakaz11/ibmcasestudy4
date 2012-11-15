
/*
 * GET home page.
 */

exports.index = function(request, response){
  response.render('index', { title: 'SW (node.js+express IBM cs4)' });
  response.render('index', { desc: 'Twitter&Facebook searchTest' });

};