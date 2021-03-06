import Sequelize from 'sequelize'
import schedue from 'node-schedule'

export default async function (sequlize: Sequelize) {
  const testSchedule = async () => {
    const { TestRemote } = sequlize.models
    await TestRemote.create({
      clinicId: 1,
      testfield: Math.random()
    })
  }

  schedue.scheduleJob('0 0 * * * *', async () => {
    await testSchedule()
  })
}
