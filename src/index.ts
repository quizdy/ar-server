import express from 'express'
import fs from 'fs'
import path from 'path'

const app: express.Express = express()
const port = process.env.PORT || 3001;
const JSONS_PATH = 'jsons'
const IMAGES_PATH = 'public/images'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/**
 * CORS
 */
app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Allow-Headers', '*');
    next();
})

/**
 * Listen
 */
app.listen(port, () => {
  console.log('port', port)
})

/**
 * Get Venues
 */
app.get('/venues', (req: express.Request, res: express.Response) => {
  const jsonsPath = path.join(__dirname, JSONS_PATH)
  if (!fs.existsSync(jsonsPath)) res.send([])
  const venues = fs.readdirSync(jsonsPath).map((json) => path.basename(json, '.json'))
  res.send(venues)
})

/**
 * Get Targets
 */
app.get('/targets', (req: express.Request, res: express.Response) => {
  const venue = req.query.venue as string | undefined;
  const jsonPath = path.join(__dirname, JSONS_PATH, venue + '.json')

  const targets = {
    venue: '',
    targets: []
  }

  if (fs.existsSync(jsonPath)) {
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    targets.venue = json.venue
    targets.targets = json.targets
  }

  res.send(targets)
})

/**
 * Update Venue
 */
app.post('/update-venue', (req: express.Request, res: express.Response) => {
  const venue = req.body.venue as string | undefined;

  const jsonsPath = path.join(__dirname, JSONS_PATH)
  if (!fs.existsSync(jsonsPath)) fs.mkdirSync(jsonsPath)

  const jsonPath = path.join(__dirname, jsonsPath, venue + '.json')

  const json = {
    venue: venue,
    targets: []
  }

  if (fs.existsSync(jsonPath)) {
    json.venue = venue
    json.targets = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')).targets;
  }

  try {
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2))
  } catch (e) {
    return false
  }
})

/**
 * Delete Venue
 */
app.post('/delete-venue', (req: express.Request, res: express.Response) => {
  const venue = req.body.venue as string | undefined;

  if (typeof venue === 'undefined') return

  const jsonsPath = path.join(__dirname, JSONS_PATH)
  if (!fs.existsSync(jsonsPath)) fs.mkdirSync(jsonsPath)

  const jsonPath = path.join(__dirname, jsonsPath, venue + '.json')
  if (fs.existsSync(jsonPath)) {
    fs.unlinkSync(jsonPath);
  }
  
  const imagesPath = path.join(__dirname, IMAGES_PATH)
  const imageDir = path.join(__dirname, imagesPath, venue)
  if (fs.existsSync(imageDir)) {
    fs.rmdirSync(imageDir, { recursive: true });
  }
})

/**
 * Update Target
 */
app.post('/update-target', (req: express.Request, res: express.Response) => {
  const venue = req.body.venue as string;
  const target = req.body.target as any;

  const jsonsPath = path.join(__dirname, JSONS_PATH)
  if (!fs.existsSync(jsonsPath)) res.send({msg: 'no exist jsons'})

  const jsonPath = path.join(__dirname, JSONS_PATH, venue + '.json')

  if (!fs.existsSync(jsonPath)) res.send({msg: 'no exist json'})
  
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const targets = json.targets.filter((t: any) => t.no === target.no)

  if (targets.length === 0) {
    const t = {
      no: json.targets.length + 1,
      title: target.title,
      lat: target.lat,
      lng: target.lng,
      pic: target.pic,
      comments: target.comments  
    }
    json.targets.push(t)
  }
  else if (targets.length === 1) {
    json.targets[0].no = target.no
    json.targets[0].title = target.title
    json.targets[0].lat = target.lat
    json.targets[0].lng = target.lng
    json.targets[0].pic = target.pic
    json.targets[0].comments = target.comments
  } else {
    return false
  }

  json.targets[0].pic = writeImage(venue, target.title, target.base64)

  try {
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2))
  } catch (e) {
    return false
  }

  return true
})

/**
 * Delete Target
 */
app.post('/delete-target', (req: express.Request, res: express.Response) => {
  const venue = req.body.venue as string;
  const target = req.body.target as any;

  const jsonsPath = path.join(__dirname, JSONS_PATH)
  if (!fs.existsSync(jsonsPath)) res.send({msg: 'no exist jsons'})

  const jsonPath = path.join(__dirname, JSONS_PATH, venue + '.json')

  if (!fs.existsSync(jsonPath)) res.send({msg: 'no exist json'})
  
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const targets = json.targets.filter((t: any) => t.no === target.no)

  if (targets.length === 0) {
    return false
  }
  else if (targets.length === 1) {
    delete json.targets[target.no]
  } else {
    return false
  }

  try {
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2))
  } catch (e) {
    return false
  }

  return true
})


/**
 * Write Image
 * @param venue 
 * @param name 
 * @param base64 
 * @returns 
 */
const writeImage = (venue: string, name: string, base64: any): string => {
  if (base64.startsWith('data:image')) {
    const data = base64.replace(/^data:\w+\/\w+;base64,/, '')
    const decoded = Buffer.from(data, 'base64')
    const ext = base64.toString().slice(base64.indexOf('/') + 1, base64.indexOf(';'))
    const dir = path.join(__dirname, IMAGES_PATH, venue)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(__dirname, IMAGES_PATH, venue, name + '.' + ext)
    try {
      fs.writeFileSync(filePath, decoded, 'base64')
    } catch (e: any) {
      console.log(e)
      return JSON.stringify(e)
    }
    return '/images/' + venue + '/' + name + '.' + ext
  }
  else {
    return ''
  }
}