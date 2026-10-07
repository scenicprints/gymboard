# The board

The Raspberry Pi 3B+ that hangs off the gym TV. It powers on showing the board
and does nothing else: no console, no login, no desktop, nothing to click.

Formerly the foosball recorder. That software is gone, see ROADMAP.md section 8.

## Build one

On a stock Raspberry Pi OS Lite, with this folder copied across:

```
sudo sh setup.sh
```

Then reboot to prove it comes up on its own.

| File | What |
|---|---|
| `gymboard-kiosk` | Launches cage with chromium in it. The URL lives here. |
| `gymboard.service` | Starts it at boot and restarts it forever. |
| `setup.sh` | Everything above, from a stock image. |

## Reaching it

`ssh jkevin@gymboard.local`

Only from the same network. It is on his home Wi-Fi, so this works from the
house, not from the work PC.

## Seeing the screen without a TV

This is the only way to know what the board is actually showing:

```
XDG_RUNTIME_DIR=/run/gymboard WAYLAND_DISPLAY=wayland-0 grim /tmp/board.png
```

Then copy it back and look at it. The HDMI output is forced on, so this works
with nothing plugged in.

## Networks

Highest priority wins. No passwords here, this repo is public.

| Priority | Name | What |
|---|---|---|
| 30 | `Corona 2.4G` | Home. Where the board lives. |
| 20 | `WagnerP8` | His phone hotspot, used to build this. |
| -10 | `Gymboard-Recovery` | The AP the Pi raises when it finds neither. |

**That recovery AP is the only way back into this board.** Its USB and its
ethernet are both dead at the chip, so there is no keyboard option, no dongle
option and no cable option. If the Pi ever cannot find a known network, join the
`Gymboard` network it broadcasts and ssh to it there. Do not delete that profile.

## Things that cost an afternoon

- **seatd is not optional.** Without it cage cannot open a seat and exits with
  "Timeout waiting session to become active". logind alone does not work here.
- **`WLR_LIBINPUT_NO_DEVICES=1` was wrong and is now unset.** The theory was
  that a board with dead USB has no input devices. It has two: the HDMI port
  registers CEC and jack detect, so wlroots starts fine without the flag. With
  it set, wlroots skips libinput and parks its default cursor in the middle of
  the screen forever, because nothing exists that could move it. The page's
  `cursor: none` cannot touch it; that cursor belongs to the compositor.
- **Sound needs `/etc/asound.conf`.** ALSA defaults to card 0, the headphone
  jack. `setup.sh` writes a default pointing at `hw:vc4hdmi,0` through `plug:`,
  which is required because vc4-hdmi rejects the raw format outright.
- **xwayland is not optional**, even though nothing uses X. cage treats a missing
  Xwayland binary as fatal.
- The service carries its own `XDG_RUNTIME_DIR` through `RuntimeDirectory=`, so
  it never waits on a login session existing.
- Chromium's exit state is scrubbed before every launch, or a hard power cut
  leaves a "restore pages" bar on the TV with nobody there to dismiss it.
