const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const { response } = require('express');
const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'password',
      database : 'facerecognitiondb'
    }
});



app.get('/',(req,res)=>{
    res.send(res.json(db.select('*').from('users')));
})

app.post('/signin',(req,res)=>{

    const{email, password} = req.body;


    db.select('email','hash').from('login')
    .where( 'email' ,'=', email )
    .then(data =>{
       const isValid = bcrypt.compareSync(password, data[0].hash);
       if(isValid){
         console.log('success');

         return db.select('*').from('users')
         .where('email','=',email)
         .then(user =>{
             console.log(user);
             res.json(user[0])
         })
         .catch(err => res.status(400).json('unable to get User'))
       }else{
       res.status(400).json('wrong info')
       }
    }).catch(err => res.status(400).json('wrong info'))
})

app.post('/register',(req, res) => {

    const{email, name, password} = req.body;

    
    const hash = bcrypt.hashSync(password);

    db.transaction( trx =>{
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then( loginEmail => {

            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
            }).then(user =>{
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('Unable to Register'))

})

app.get('/profile/:id', (req, res) =>{

    const{id} = req.params;

    db.select('*').from('users').where({id})
    .then(user =>{
        console.log(user)
        if(user.length){
            res.json(user[0])
        } else {
            res.status(400).json('not found')
        }
    }).catch(err => res.status(400).json('error getting user'))

})

app.put('/image',(req, res) =>{

    const{id} = req.body;

  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries =>{
      res.json(entries[0]);
  }).catch(err => res.status(400).json('unable to get entries')) 
})


app.listen(3000,()=>{
    console.log('app is running on port 3000');
})