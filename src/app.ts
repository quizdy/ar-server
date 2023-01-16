import express from 'express'
import fs from 'fs'
import path from 'path'

const app: express.Express = express()
const port = process.env.PORT || 3001;

const USERS_PATH = '../users'
const VENUES_PATH = '../public/venues'
const IMAGES_PATH = '../public/images'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('images'))

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
  console.log('venues')
  const venuesPath = path.join(__dirname, VENUES_PATH)
  if (!fs.existsSync(venuesPath)) {
    res.send([])
    return
  }
  const venues = fs.readdirSync(venuesPath).map((json) => path.basename(json, '.json'))
  res.send(venues)
})

/**
 * Get Targets
 */
app.get('/targets', (req: express.Request, res: express.Response) => {
  console.log('targets', req)
  const venue = req.query.venue as string | undefined;
  const venuePath = path.join(__dirname, VENUES_PATH, venue + '.json')

  const targets = {
    venue: '',
    targets: []
  }

  if (fs.existsSync(venuePath)) {
    const json = JSON.parse(fs.readFileSync(venuePath, 'utf-8'));
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

  const venuesPath = path.join(__dirname, VENUES_PATH)
  if (!fs.existsSync(venuesPath)) fs.mkdirSync(venuesPath, {recursive: true})

  const venuePath = path.join(venuesPath, venue + '.json')

  const targets = {
    venue: venue,
    targets: []
  }

  if (fs.existsSync(venuePath)) {
    targets.venue = venue
    targets.targets = JSON.parse(fs.readFileSync(venuePath, 'utf-8')).targets;
  }

  try {
    fs.writeFileSync(venuePath, JSON.stringify(targets, null, 2))
  } catch (e) {
    res.send({
      ret: false,
      msg: JSON.stringify(e)
    })
    return
  }

  res.send({
    ret: true,
    msg: 'success'
  })
})

/**
 * Delete Venue
 */
app.post('/delete-venue', (req: express.Request, res: express.Response) => {
  const venue = req.body.venue as string | undefined;

  if (typeof venue === 'undefined') return

  const venuesPath = path.join(__dirname, VENUES_PATH)
  if (!fs.existsSync(venuesPath)) {
    res.send({
      ret: false,
      msg: 'not found venues'
    })
  }

  const venuePath = path.join(venuesPath, venue + '.json')
  if (fs.existsSync(venuePath)) {
    fs.unlinkSync(venuePath);
  }
  else {
    res.send({
      ret: false,
      msg: 'not found venue'
    })
  }
  
  const imagesPath = path.join(__dirname, IMAGES_PATH)
  const imageDir = path.join(__dirname, imagesPath, venue)
  if (fs.existsSync(imageDir)) {
    fs.rmdirSync(imageDir, { recursive: true });
  }

  res.send({
    ret: true,
    msg: 'success'
  })
})

/**
 * Update Target
 */
app.post('/update-target', (req: express.Request, res: express.Response) => {
  const venue = req.body.venue as string;
  const target = req.body.target as any;

  const venuesPath = path.join(__dirname, VENUES_PATH)
  if (!fs.existsSync(venuesPath)) {
    res.send({msg: 'no exist venues'})
    return
  }

  const venuePath = path.join(__dirname, VENUES_PATH, venue + '.json')

  if (!fs.existsSync(venuePath)) {
    res.send({msg: 'no exist venue'})
    return
  }
  
  const json = JSON.parse(fs.readFileSync(venuePath, 'utf-8'))
  let pos = json.targets.findIndex((t: any) => t.no === target.no)

  if (pos < 0) {
    const t = {
      no: json.targets.length === 0 ? 1 : json.targets[json.targets.length - 1].no + 1,
      title: target.title,
      lat: target.lat,
      lng: target.lng,
      pic: target.pic,
      comments: target.comments  
    }
    pos = json.targets.length
    json.targets.push(t)
  }
  else {
    json.targets[pos].title = target.title
    json.targets[pos].lat = target.lat
    json.targets[pos].lng = target.lng
    json.targets[pos].pic = target.pic
    json.targets[pos].comments = target.comments
  }

  // json.targets[pos].pic = writeImage(venue, target.title, target.base64)

  if (!json.targets[pos].pic) {
    res.send({
      ret: false,
      msg: 'failed to write image'
    })
    return
  }

  try {
    fs.writeFileSync(venuePath, JSON.stringify(json, null, 2))
  } catch (e) {
    res.send({
      ret: false,
      msg: JSON.stringify(e)
    })
    return
  }

  res.send({
    ret: true,
    msg: 'success'
  })
})

/**
 * Delete Target
 */
app.post('/delete-target', (req: express.Request, res: express.Response) => {
  const venue = req.body.venue as string;
  const target = req.body.target as any;

  const venuesPath = path.join(__dirname, VENUES_PATH)
  if (!fs.existsSync(venuesPath)) {
    res.send({msg: 'no exist venues'})
    return
  }

  const venuePath = path.join(__dirname, VENUES_PATH, venue + '.json')

  if (!fs.existsSync(venuePath)) {
    res.send({msg: 'no exist venue'})
    return
  }
  
  const json = JSON.parse(fs.readFileSync(venuePath, 'utf-8'))

  let pos = json.targets.findIndex((t: any) => t.no === target.no)

  if (pos < 0) {
    res.send({
      ret: false,
      msg: 'no exist target'
    })
    return
  }
  else {
    const imagesPath = path.join(__dirname, IMAGES_PATH)
    const image = path.join(__dirname, imagesPath, venue, json.targets[pos].pic)
    if (fs.existsSync(image)) {
      fs.unlinkSync(image)
    }
    delete json.targets[pos]
  }

  try {
    fs.writeFileSync(venuePath, JSON.stringify(json, null, 2))
  } catch (e) {
    res.send({
      ret: false,
      msg: JSON.stringify(e)
    })
    return
  }

  res.send({
    ret: true,
    msg: 'success'
  })
})

/**
 * Write Image
 * @param venue 
 * @param title 
 * @param base64 
 * @returns 
 */
const writeImage = (venue: string, title: string, base64: any): string => {
  if (!venue || !title || !base64) return ''
  if (base64.startsWith('data:image')) {
    const data = base64.replace(/^data:\w+\/\w+;base64,/, '')
    const decoded = Buffer.from(data, 'base64')
    const ext = base64.toString().slice(base64.indexOf('/') + 1, base64.indexOf(';'))
    const dir = path.join(__dirname, IMAGES_PATH, venue)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(__dirname, IMAGES_PATH, venue, title + '.' + ext)
    try {
      fs.writeFileSync(filePath, decoded, 'base64')
    } catch (e: any) {
      return JSON.stringify(e)
    }
    return '/images/' + venue + '/' + title + '.' + ext
  }
  else {
    return ''
  }
}