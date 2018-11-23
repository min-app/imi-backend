import express from 'express'
const router = express.Router()

router.use('/', async (req, res) => {
  res.send('test router success!')
})

export default router
