import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import {Cat} from '../../interfaces/Cat';
import CatModel from '../models/catModel';
import {User} from '../../interfaces/User';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {validationResult} from 'express-validator';

// TODO: create following functions:
//ok - catGetByUser - get all cats by current user id
//kämänen kai - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
//ok - catPutAdmin - only admin can change cat owner
//ok - catDeleteAdmin - only admin can delete cat
//ok - catDelete - only owner can delete cat
//ok - catPut - only owner can update cat
//ok - catGet - get cat by id
//ok - catListGet - get all cats
//ok - catPost - create new cat

const catGetByUser = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const currentUser = req.user as User;
    if (!currentUser) {
      next(new CustomError('User not found', 404));
      return;
    }

    const cats = await CatModel.find({'owner._id': currentUser._id}).select(
      '-__v'
    );
    res.json(cats);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {topRight, bottomLeft} = req.query;
    const topRightStr = topRight as string;
    const bottomLeftStr = bottomLeft as string;

    const topRightCoords = topRightStr.split(',').map(Number);
    const bottomLeftCoords = bottomLeftStr.split(',').map(Number);

    const [topRightLon, topRightLat] = topRightCoords;
    const [bottomLeftLon, bottomLeftLat] = bottomLeftCoords;

    const boundingBox = {
      type: 'Polygon',
      coordinates: [
        [
          [bottomLeftLon, topRightLat],
          [topRightLon, topRightLat],
          [topRightLon, bottomLeftLat],
          [bottomLeftLon, bottomLeftLat],
          [bottomLeftLon, topRightLat],
        ],
      ],
    };

    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $geometry: boundingBox,
        },
      },
    });

    res.json(cats);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const cat = await CatModel.findById(req.params.id).select('-__v');
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    res.json(cat);
  } catch (error) {
    console.log(error);
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await CatModel.find().select('-__v');
    if (!cats || cats.length === 0) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catPost = async (
  req: Request<{}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const catToCreate = {
      ...req.body,
      filename: req.file?.filename,
      location: res.locals.coords,
      owner: {_id: (req.user as User)._id},
    };
    const cat = await CatModel.create(catToCreate);
    const message: DBMessageResponse = {
      message: 'Cat created',
      data: cat,
    };
    res.status(200).json(message);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const catNotYetUpdated = await CatModel.findById(req.params.id);
    const owner = catNotYetUpdated?.owner;
    if (owner === undefined) {
      console.log('no owners present');
      return;
    }

    if ((req.user as User)._id !== owner._id) {
      throw new CustomError('Owner only', 403);
    }

    const catToUpdate = {
      ...req.body,
      filename: req.file?.filename,
      location: res.locals.coords,
      owner: {_id: (req.user as User)._id},
    };

    const cat = await CatModel.findByIdAndUpdate(req.params.id, catToUpdate, {
      new: true,
    });
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const message: DBMessageResponse = {
      message: 'Animal updated',
      data: cat,
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    if ((req.user as User).email !== 'admin@metropolia.fi') {
      throw new CustomError('Admin only', 403);
    }

    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const message: DBMessageResponse = {
      message: 'Animal updated',
      data: cat,
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catDelete = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const catNotYetUpdated = await CatModel.findById(req.params.id);
    const owner = catNotYetUpdated?.owner;
    if (owner === undefined) {
      console.log('no owners present');
      return;
    }

    if ((req.user as User)._id !== owner._id) {
      throw new CustomError('Owner only', 403);
    }

    const cat = await CatModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    const message: DBMessageResponse = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catDeleteAdmin = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    if ((req.user as User).email !== 'admin@metropolia.fi') {
      throw new CustomError('Admin only', 403);
    }

    const cat = await CatModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    const message: DBMessageResponse = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catGet,
  catListGet,
  catPost,
  catPut,
  catPutAdmin,
  catDelete,
  catDeleteAdmin,
};
