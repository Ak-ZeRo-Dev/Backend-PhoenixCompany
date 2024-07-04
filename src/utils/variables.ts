export enum Roles {
  user = "user",
  admin = "admin",
  owner = "owner",
}

export const RGX = {
  username: /^[A-Za-z]{3,30}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[Aa])(?=.*[!@#$%^&*()\-_=+~`?<>:;"'{}\/\[\]\\/÷×؛،’]).{6,}$/,
};

export enum typeItems {
  faq = "faq",
  category = "category",
  banner = "banner",
}

export enum notificationType {
  read = "read",
  unread = "unread",
}

export enum layoutType {
  faq = "faq",
  logo = "logo",
  bannerText = "bannertext",
  bannerImages = "bannerimages",
  categories = "categories",
  navItems = "navitems",
  services = "services",
  learnNow = "learnnow",
  social = "social",
}

export enum analyticsType {
  year = "year",
  month = "month",
  week = "week",
}

export enum actionType {
  all = "all",
  one = "one",
  many = "many",
}
