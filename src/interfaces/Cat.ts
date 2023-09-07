import {Point} from 'geojson';
import {Document} from 'mongoose';

interface Cat extends Document {
  cat_name: string;
  weight: number;
  filename: string;
  birthdate: Date;
  location: {type: Point; coordinates: number[]};
  owner: {
    _id: string;
  };
}

export {Cat};
