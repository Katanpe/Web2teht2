import express, {Request} from 'express';
import {
  catDelete,
  catGet,
  catListGet,
  catPost,
  catPut,
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
} from '../controllers/catController';
import multer, {FileFilterCallback} from 'multer';
import {body, param, query} from 'express-validator';
import passport from '../../passport';
import {getCoordinates, makeThumbnail} from '../../middlewares';

const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.includes('image')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({dest: './uploads/', fileFilter});
const router = express.Router();

router
  .route('/')
  .get(catListGet)
  .post(
    passport.authenticate('jwt', {session: false}),
    upload.single('cat'),
    makeThumbnail,
    getCoordinates,
    body('cat_name').notEmpty().escape(),
    body('birthdate').isDate(),
    body('weight').isNumeric(),
    catPost
  );

router.route('/area').get(catGetByBoundingBox);

router
  .route('/user')
  .get(
    passport.authenticate('jwt', {session: false}),
    param('id').isString(),
    catGetByUser
  );

router
  .route('/admin/:id')
  .put(
    passport.authenticate('jwt', {session: false}),
    param('id').isString(),
    catPutAdmin
  )
  .delete(
    passport.authenticate('jwt', {session: false}),
    param('id').isString(),
    catDeleteAdmin
  );

router
  .route('/:id')
  .get(param('id').isString(), catGet)
  .put(
    passport.authenticate('jwt', {session: false}),
    param('id').isString(),
    catPut
  )
  .delete(
    passport.authenticate('jwt', {session: false}),
    param('id').isString(),
    catDelete
  );

export default router;
