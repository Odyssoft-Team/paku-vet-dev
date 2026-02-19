import React from "react";
import { ViewStyle } from "react-native";
import { SvgProps } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";

import AddPlusIcon from "@assets/icons/add-plus.svg";
import ArrowBackIcon from "@assets/icons/arrow-back.svg";
import ArrowdownIcon from "@assets/icons/arrow-down.svg";
import ArrowLeftIcon from "@assets/icons/arrow-left.svg";
import ArrowRightIcon from "@assets/icons/arrow-right.svg";
import ArrowUpIcon from "@assets/icons/arrow-up.svg";
import CalendarIcon from "@assets/icons/calendar.svg";
import CameraIcon from "@assets/icons/camera.svg";
import CartIcon from "@assets/icons/cart.svg";
import ChatIcon from "@assets/icons/chat.svg";
import CheckIcon from "@assets/icons/check.svg";
import CloseIcon from "@assets/icons/close.svg";
import DownloadIcon from "@assets/icons/download.svg";
import EyeClosedIcon from "@assets/icons/eye-closed.svg";
import EyeOpenIcon from "@assets/icons/eye-open.svg";
import FacebookIcon from "@assets/icons/facebook.svg";
import FemaleIcon from "@assets/icons/female.svg";
import FileIcon from "@assets/icons/file.svg";
import GpsIcon from "@assets/icons/gps.svg";
import HappyIcon from "@assets/icons/happy.svg";
import HomeIcon from "@assets/icons/home.svg";
import ImageIcon from "@assets/icons/image.svg";
import InstagramIcon from "@assets/icons/instagram.svg";
import LogoutIcon from "@assets/icons/logout.svg";
import MaleIcon from "@assets/icons/male.svg";
import NotificationIcon from "@assets/icons/notification.svg";
import PencilIcon from "@assets/icons/pencil.svg";
import PetsIcon from "@assets/icons/pets.svg";
import PlusIcon from "@assets/icons/plus.svg";
import ProfileIcon from "@assets/icons/profile.svg";
import SearchIcon from "@assets/icons/search.svg";
import SendIcon from "@assets/icons/send.svg";
import ServicesIcon from "@assets/icons/services.svg";
import TicketIcon from "@assets/icons/ticket.svg";
import TransportIcon from "@assets/icons/transport.svg";
import VisualizeIcon from "@assets/icons/visualize.svg";
import WalletIcon from "@assets/icons/wallet.svg";
import WhatsappIcon from "@assets/icons/whatsapp.svg";
import AppleIcon from "@assets/icons/apple.svg";
import GoogleIcon from "@assets/icons/google.svg";
import Facebook2Icon from "@assets/icons/facebook-2.svg";

// Mapa de iconos
const icons = {
  "add-plus": AddPlusIcon,
  "arrow-back": ArrowBackIcon,
  "arrow-down": ArrowdownIcon,
  "arrow-left": ArrowLeftIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-up": ArrowUpIcon,
  calendar: CalendarIcon,
  camera: CameraIcon,
  cart: CartIcon,
  chat: ChatIcon,
  check: CheckIcon,
  close: CloseIcon,
  download: DownloadIcon,
  "eye-closed": EyeClosedIcon,
  "eye-open": EyeOpenIcon,
  facebook: FacebookIcon,
  female: FemaleIcon,
  file: FileIcon,
  gps: GpsIcon,
  happy: HappyIcon,
  home: HomeIcon,
  image: ImageIcon,
  instagram: InstagramIcon,
  logout: LogoutIcon,
  male: MaleIcon,
  notification: NotificationIcon,
  pencil: PencilIcon,
  pets: PetsIcon,
  plus: PlusIcon,
  profile: ProfileIcon,
  search: SearchIcon,
  send: SendIcon,
  services: ServicesIcon,
  ticket: TicketIcon,
  transport: TransportIcon,
  visualize: VisualizeIcon,
  wallet: WalletIcon,
  whatsapp: WhatsappIcon,
  apple: AppleIcon,
  google: GoogleIcon,
  "facebook-2": Facebook2Icon,
};

export type IconName = keyof typeof icons;

interface IconProps extends SvgProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
  useThemeColor?: boolean; // Nueva prop para usar color del tema automáticamente
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  style,
  useThemeColor = false,
  ...props
}) => {
  const { colors } = useTheme();
  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  // Determinar el color final
  const finalColor = color || (useThemeColor ? colors.text : colors.primary);

  return (
    <IconComponent
      width={size}
      height={size}
      fill={finalColor}
      color={finalColor} // Agregar también color
      style={style}
      {...props}
    />
  );
};
