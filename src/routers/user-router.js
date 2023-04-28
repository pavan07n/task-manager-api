const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user.js')
const auth = require('../middleware/auth.js')
const {sendWelcomeEmail, sendCancelEmail} = require('../emails/account.js')
const router = new express.Router()


//User Endpoint for creating new user
router.post('/users/signup', async (req, res) => {
    const user = new User(req.body)
       
    try { 
       await  user.save()
       sendWelcomeEmail(user.email, user.name)
       const token = await user.generateAuthToken()
         res.status(201).send({user, token})
    } catch(error) {
         res.status(400).send(error)
    }
 })

 //User endpoint for user log in
 router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials (req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    }
    catch(error) {
        res.status(400).send()
    }
 })

 //User endpoint for user log out
 router.post('/users/logout', auth, async (req, res) => {
    try {
            req.user.tokens = req.user.tokens.filter((token) => {
                return token.token !== req.token
            })
            await req.user.save()
            
            res.send('Logged out successfully!')
    } 
    catch(error) {
        res.status(500).send()
    }
 }) 

 //User endpoint for logout of all devices
 router.post('/users/logoutAll', auth, async (req, res) => {
    try{
            req.user.tokens = []
            await req.user.save()
            res.send('Logged out of all devices')
    }
    catch(error) {
        res.status(500).send()
    }
 })
 
 //User endpoint for reading user profile
 router.get('/users/me/profile', auth, async (req, res) => {
    res.send(req.user)
 })
 
 //User endpoint for updating user
 router.patch('/users/me/update', auth, async (req, res) => {
         const userUpdates = Object.keys(req.body)
         const allowedUpdates = ['name', 'email', 'password', 'age']
         const isValidUpdate = userUpdates.every((update) => allowedUpdates.includes(update))
              
             if (!isValidUpdate) {
                 return res.status(400).send({error: 'Invalid Update(s)!'})
            }
 
     try{
        userUpdates.forEach ((update) =>  req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
     }
     catch(error) {
         res.status(500).send(error)
     }
 })
 
 //User endpoint for deleting users
 router.delete('/users/me/delete', auth,  async (req, res) => {
     try{   
           await req.user.deleteOne()
           sendCancelEmail(req.user.email, req.user.name)
           res.send(req.user)
     }
     catch(error) {
         res.status(500).send()
     }
 })

//Profile image CRUD
 const upload = multer({
    limits: {
        fileSize: 2097152     //2MB limit
    },

    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Please upload an image (JPG|JPEG|PNG)'))
        }

        cb(undefined, true)
    }
 })

 //Profile avatar upload
 router.post('/users/me/avatar',auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({height: 320, width: 320}).png().toBuffer()    
    req.user.avatar = buffer
    await req.user.save()
    res.send()

 }, (error, req, res, next) => {
    res.status(400).send({error: error.message})
 })

 
 //View profile avatar
 router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }
    catch(error) {
        res.status(404).send()
    }
 })

 //Profile avatar delete
 router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send('Avatar deleted!')
 })

module.exports = router