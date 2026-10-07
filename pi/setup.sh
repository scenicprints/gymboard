#!/bin/sh
# ─────────────────────────────────────────────────────────────────────
# Build the Gymboard appliance from a stock Raspberry Pi OS Lite.
#
# Run it on the Pi:  sudo sh setup.sh
#
# Idempotent. Safe to run again after a change, and safe to run on a Pi
# that is already set up.
#
# What it produces: a Pi that powers on showing the board and does
# nothing else. No console, no login, no desktop, nothing to click.
# ─────────────────────────────────────────────────────────────────────
set -e

KIOSK_USER="${KIOSK_USER:-jkevin}"
HERE=$(cd "$(dirname "$0")" && pwd)

echo "==> packages"
apt-get update -qq
# cage is a compositor that runs exactly one full screen client.
# seatd is how it gets the display with no login session: without it cage
#   dies with "Timeout waiting session to become active".
# xwayland is never used, but cage treats it as fatal when missing.
# grim is the only way to see the screen when no TV is attached.
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  cage chromium xwayland seatd grim

echo "==> seatd"
systemctl enable --now seatd
# The seatd socket is group video, which the kiosk user needs.
usermod -aG video,render,input "$KIOSK_USER"

echo "==> kiosk"
install -m 755 "$HERE/gymboard-kiosk" /usr/local/bin/gymboard-kiosk
install -m 644 "$HERE/gymboard.service" /etc/systemd/system/gymboard.service
systemctl daemon-reload

echo "==> the way back in"
# If it ever cannot find a known network it raises its own, which is the
# only route into a machine with no USB, no ethernet and no keyboard. The
# timer is what stops it sitting there once a real network returns.
install -m 755 "$HERE/gymboard-netcheck" /usr/local/bin/gymboard-netcheck
install -m 644 "$HERE/gymboard-netcheck.service" /etc/systemd/system/gymboard-netcheck.service
install -m 644 "$HERE/gymboard-netcheck.timer" /etc/systemd/system/gymboard-netcheck.timer
systemctl daemon-reload
systemctl enable --now gymboard-netcheck.timer

echo "==> sound goes to the TV"
# The Pi exposes two outputs: the headphone jack nobody has plugged
# anything into, and HDMI. Without this, ALSA defaults to card 0 and the
# rest timer beeps into a 3.5mm socket.
#
# plug: in front of it because vc4-hdmi rejects the format Chromium asks
# for. Straight hw:vc4hdmi,0 fails with "Setting of hwparams failed".
cat > /etc/asound.conf <<'EOF'
pcm.!default {
  type plug
  slave.pcm "hw:vc4hdmi,0"
}
ctl.!default {
  type hw
  card vc4hdmi
}
EOF

echo "==> the screen belongs to the board, not to a console"
systemctl disable --now getty@tty1 || true

echo "==> hold the HDMI output on"
# Without this the Pi drops the output when the TV sleeps, and the board
# is not drawn when it wakes. D forces the mode on with nothing attached.
# A real TV still drives its own resolution through EDID.
CMDLINE=/boot/firmware/cmdline.txt
[ -f "$CMDLINE" ] || CMDLINE=/boot/cmdline.txt
if ! grep -q "video=HDMI" "$CMDLINE"; then
  cp "$CMDLINE" "$CMDLINE.bak"
  sed -i "1s|$| video=HDMI-A-1:1920x1080@60D|" "$CMDLINE"
fi

echo "==> go"
systemctl enable gymboard
systemctl restart gymboard

echo
echo "Done. Reboot to prove it comes up on its own."
echo "To see what is on screen without a TV:"
echo "  XDG_RUNTIME_DIR=/run/gymboard WAYLAND_DISPLAY=wayland-0 grim /tmp/board.png"
