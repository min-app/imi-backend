import schedue from 'node-schedule'

export default async function (sequlize: Sequelize) {
  function testSchedue () {
    const { TestRemote } = sequlize.models
    await TestRemote.create({
      clinicId: 1,
      testfield: Math.random()
    })
  }

  schedue.scheduleJob('0 0 * * * *', () => {
    testSchedue()
  })
}