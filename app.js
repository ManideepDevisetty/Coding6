const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null
const initilializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}
initilializeDBAndServer()

app.get('/states/', async (request, response) => {
  const stateslist = `
    SELECT * FROM state ORDER BY state_id;`
  const StatesArray = await db.all(stateslist)
  response.send(StatesArray)
})

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getState = `
  SELECT * FROM state WHERE state_id = ${stateId};`
  const state = await db.get(getState)
  response.send(state)
})

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictQuery = `
  INSERT INTO 
   district (district_name,state_id,cases,cured,active,deaths)
   VALUES 
   (
    '${districtName}',
    '${stateId}',  
    '${cases}',
    '${cured}',
    '${active}',
    '${deaths}' 
   );`
  const dbResponse = await db.run(addDistrictQuery)
  const districtId = dbResponse.lastID
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT * 
  FROM district
  WHERE district_id = ${districtId};`
  const district = await db.get(getDistrictQuery)
  response.send(district)
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
  district
  WHERE
  district_id = ${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
  UPDATE 
  district
  SET
   district_name = '${districtName}',
    state_id='${stateId}',  
   cases= '${cases}',
   cured= '${cured}',
    active='${active}',
    deaths='${deaths}' 
    WHERE district_id = ${districtId};`
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
  SELECT 
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
  FROM
  district
  WHERE state_id = ${stateId};`
  const stats = await db.get(getStatsQuery)

  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
  select state_id from district
  where district_id = ${districtId};`
  const getDistIdQueryResp = await db.get(getDistrictIdQuery)
  const getStateNameQuery = `
  select state_name as statename from state
  where state_id = ${getDistIdQueryResp.state_id};`
  const getRes = await db.get(getStateNameQuery)
  response.send(getRes)
})
