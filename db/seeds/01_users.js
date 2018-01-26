
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {id: 1, name: 'kishor', email: 'kishorgujr94@gmail.com', password: 'password'},
      ]);
    });
};
