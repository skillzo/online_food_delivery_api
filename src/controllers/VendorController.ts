import { Request, Response, NextFunction } from "express";
import {
  CreateFoodInput,
  CreateOfferInputs,
  EditVendorInput,
  VendorLoginInput,
} from "../dto";
import { Food, Vendor } from "../models";
import { Offer } from "../models/Offer";
import { Order } from "../models/Order";
import { GenerateSignature, ValidatePassword } from "../utility";
import { FindVendor } from "./AdminController";
import { isArray } from "class-validator";
import { error } from "winston";

export const VendorLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = <VendorLoginInput>req.body;

  const existingUser = await FindVendor("", email);

  if (existingUser !== null) {
    const validation = await ValidatePassword(
      password,
      existingUser.password,
      existingUser.salt
    );
    if (validation) {
      const signature = await GenerateSignature({
        _id: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
      });
      return res.json(signature);
    }
  }

  return res.json({ message: "Login credential is not valid" });
};

export const GetVendorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const vendor = Vendor.findById(req.params.id);
    return res.status(200).json(vendor);
  } catch (err) {
    return res.status(400).json(err);
  }
};

export const GetAllVenders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const name = req.query.name;
  const skip = (page - 1) * limit;
  const filter = name ? { name: { $regex: name, $options: "i" } } : {};

  try {
    const vendor = await Vendor.find(filter).skip(skip).limit(limit);
    const total = await Vendor.countDocuments(filter);
    return res
      .status(200)
      .json({ data: vendor, page, per_page: limit, totalCount: total });
  } catch (err) {
    return res.status(400).json(err);
  }
};
export const GetVendorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  try {
    const existingVendor = await FindVendor(user._id);
    return res.json(existingVendor);
  } catch (err) {
    return res.json({ message: "vendor Information Not Found", err: err });
  }
};

export const UpdateVendorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  try {
    await Vendor.findByIdAndUpdate(user._id, {
      ...(req.body as EditVendorInput),
    });

    return res.status(200).json({
      message: "Vendor profile updated successfully",
    });
  } catch (err) {
    return res.status(400).json({
      message: "Unable to Update vendor profile ",
    });
  }
};

export const UpdateVendorCoverImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const vendor = await FindVendor(user._id);

    if (vendor !== null) {
      const files = req.files as [Express.Multer.File];

      const images = files.map((file: Express.Multer.File) => file.filename);

      vendor.coverImages.push(...images);

      const saveResult = await vendor.save();

      return res.json(saveResult);
    }
  }
  return res.json({ message: "Unable to Update vendor profile " });
};

export const UpdateVendorService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  const { lat, lng } = req.body;

  if (user) {
    const existingVendor = await FindVendor(user._id);

    if (existingVendor !== null) {
      existingVendor.serviceAvailable = !existingVendor.serviceAvailable;
      if (lat && lng) {
        existingVendor.lat = lat;
        existingVendor.lng = lng;
      }
      const saveResult = await existingVendor.save();

      return res.json(saveResult);
    }
  }
  return res.json({ message: "Unable to Update vendor profile " });
};

export const AddFood = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const vendor = await FindVendor(user._id);

  if (!vendor) return res.json({ message: "Vendor Not Found" });

  if (isArray(req.body as CreateFoodInput)) {
    try {
      const food = await Food.insertMany(req.body);
      const food_ids = food.map((food: { _id: string }) => food._id);
      await Vendor.updateOne(
        { _id: vendor._id },
        { $push: { foods: { $each: food_ids } } }
      );
      return res.status(200).json({ message: "Food List Added Successfully" });
    } catch (error) {
      console.log("Error adding food to vendor profile", error);
      return res
        .status(400)
        .json({ message: "Error adding food to vendor profile" });
    }
  } else {
    const food = new Food.create(req.body);
    const result = await food.save();

    if (result)
      await Vendor.updateOne(
        { _id: vendor._id },
        { $push: { foods: result._id } }
      );

    return res.status(200).json({ message: "Food Added Successfully" });
  }
};

export const GetFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.page_size as string) || 10;
  const skip = (page - 1) * limit;
  const name = req.query.name as string;

  const filter = name
    ? {
        $or: [
          { name: { $regex: name, $options: "i" } },
          { description: { $regex: name, $options: "i" } },
        ],
      }
    : {};

  const query = {
    vendorId: user._id,
    ...filter,
  };

  if (user) {
    const foods = await Food.find(query).skip(skip).limit(limit);

    const total = await Food.countDocuments(query);
    return res.status(200).json({
      foods,
      page,
      total_count: total,
      total_pages: Math.ceil(total / limit),
    });
  }
  return res.json({ message: "Foods not found!" });
};

export const GetFoodById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const foodId = req.params.id;
  try {
    const food = await Food.findById(foodId);
    return res.status(200).json(food);
  } catch (err) {
    return res.status(404).json({ message: "Food Not Found", error: err });
  }
};

export const GetCurrentOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const orders = await Order.find({ vendorId: user._id }).populate(
      "items.food"
    );

    if (orders != null) {
      return res.status(200).json(orders);
    }
  }

  return res.json({ message: "Orders Not found" });
};

export const GetOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;

  if (orderId) {
    const order = await Order.findById(orderId).populate("items.food");

    if (order != null) {
      return res.status(200).json(order);
    }
  }
  return res.json({ message: "Order Not found" });
};

export const ProcessOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;

  const { status, remarks, time } = req.body;

  if (orderId) {
    const order = await Order.findById(orderId).populate("food");

    order.orderStatus = status;
    order.remarks = remarks;
    if (time) {
      order.readyTime = time;
    }

    const orderResult = await order.save();

    if (orderResult != null) {
      return res.status(200).json(orderResult);
    }
  }

  return res.json({ message: "Unable to process order" });
};

export const GetOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    let currentOffer = Array();

    const offers = await Offer.find().populate("vendors");

    if (offers) {
      offers.map((item) => {
        if (item.vendors) {
          item.vendors.map((vendor) => {
            if (vendor._id.toString() === user._id) {
              currentOffer.push(item);
            }
          });
        }

        if (item.offerType === "GENERIC") {
          currentOffer.push(item);
        }
      });
    }

    return res.status(200).json(currentOffer);
  }

  return res.json({ message: "Offers Not available" });
};

export const AddOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const {
      title,
      description,
      offerType,
      offerAmount,
      pincode,
      promocode,
      promoType,
      startValidity,
      endValidity,
      bank,
      bins,
      minValue,
      isActive,
    } = <CreateOfferInputs>req.body;

    const vendor = await FindVendor(user._id);

    if (vendor) {
      const offer = await Offer.create({
        title,
        description,
        offerType,
        offerAmount,
        pincode,
        promoType,
        startValidity,
        endValidity,
        bank,
        isActive,
        minValue,
        vendor: [vendor],
      });

      console.log(offer);

      return res.status(200).json(offer);
    }
  }

  return res.json({ message: "Unable to add Offer!" });
};

export const EditOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const offerId = req.params.id;

  if (user) {
    const {
      title,
      description,
      offerType,
      offerAmount,
      pincode,
      promocode,
      promoType,
      startValidity,
      endValidity,
      bank,
      bins,
      minValue,
      isActive,
    } = <CreateOfferInputs>req.body;

    const currentOffer = await Offer.findById(offerId);

    if (currentOffer) {
      const vendor = await FindVendor(user._id);

      if (vendor) {
        (currentOffer.title = title),
          (currentOffer.description = description),
          (currentOffer.offerType = offerType),
          (currentOffer.offerAmount = offerAmount),
          (currentOffer.pincode = pincode),
          (currentOffer.promoType = promoType),
          (currentOffer.startValidity = startValidity),
          (currentOffer.endValidity = endValidity),
          (currentOffer.bank = bank),
          (currentOffer.isActive = isActive),
          (currentOffer.minValue = minValue);

        const result = await currentOffer.save();

        return res.status(200).json(result);
      }
    }
  }

  return res.json({ message: "Unable to add Offer!" });
};
