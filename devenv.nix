{ pkgs, ... }:

{
  # https://devenv.sh/basics/
  env = {
    LIGOPATH = "${pkgs.ligoPackages.ligo-fa}";
  };

  # https://devenv.sh/packages/
  packages = [ pkgs.git pkgs.ligo pkgs.gnumake pkgs.nodejs ];

  languages.typescript.enable = true;

  enterShell = ''
    
  '';

  # https://devenv.sh/languages/
  # languages.nix.enable = true;

  # https://devenv.sh/pre-commit-hooks/
  # pre-commit.hooks.shellcheck.enable = true;

  # https://devenv.sh/processes/
  # processes.ping.exec = "ping example.com";

  # See full reference at https://devenv.sh/reference/options/
}
