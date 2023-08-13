import React, { CSSProperties } from "react";
import styles from "./btn.module.css";

type BtnProps = {
  children: JSX.Element | string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  backgroundColor?: string;
  color?: string;
  radius?: string;
  margin?: string;
  fontSize?: string;
};

const CircleBtn = (props: BtnProps) => {
  return (
    <div
      className={styles.div_circle}
      onClick={props.onClick}
      style={
        {
          "--background-color": props.backgroundColor,
          "--color": props.color ?? "white",
          "--width": props.radius,
          "--height": props.radius,
          "--margin": props.margin,
          "--font-size": props.fontSize,
        } as CSSProperties
      }>
      {props.children}
    </div>
  );
};
export default CircleBtn;
